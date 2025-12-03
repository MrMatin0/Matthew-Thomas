
import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Part, Content, Modality } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, ChatRole, Model, TtsVoice, GroundingChunk, ChatAttachment, AudioOutput, FireAiState } from '../types';

interface UseGeminiProps {
    model: Model;
    ttsVoice: TtsVoice;
    systemInstruction: string;
    candidateCount: number;
    addMessageToSession: (sessionId: string, message: ChatMessage) => void;
    updateMessageById: (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => void;
    updateFireAiState: (sessionId: string, messageId: string, state: FireAiState | undefined, content?: string) => void;
    apiKey: string;
}

const buildApiContents = (history: ChatMessage[]): Content[] => {
    return history.map(msg => {
        const parts: Part[] = [];
        
        // Handle attachments (Images, etc.)
        if (msg.attachments && msg.attachments.length > 0) {
            msg.attachments.forEach(att => {
                if (att.type === 'image') {
                    parts.push({ 
                        inlineData: { 
                            data: att.data.split(',')[1], 
                            mimeType: att.mimeType 
                        } 
                    });
                }
            });
        }

        if (msg.content) {
            parts.push({ text: msg.content });
        }
        return { role: msg.role, parts };
    }).filter(content => content.parts.length > 0);
};

export const useGemini = ({
    model, ttsVoice, systemInstruction, candidateCount,
    addMessageToSession, updateMessageById, updateFireAiState, apiKey
}: UseGeminiProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsLoading(false);
        setGenerationStartTime(null);
    }, []);

    const handleApiCall = async <T>(
        activeSessionId: string,
        messageId: string,
        apiLogic: () => Promise<T>
    ) => {
        const startTime = Date.now();
        abortControllerRef.current = new AbortController();
        try {
            await apiLogic();
        } catch (error: any) {
            console.error("Error during API call:", error);
            
            let errorMessage = error instanceof Error ? error.message : String(error);
            let friendlyError = '';

            // Try to extract useful info from the JSON error string if possible
            if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                const isGemini3 = model.includes('gemini-3') || model === 'web-search';
                
                friendlyError = `\n\n**🛑 خطای محدودیت دسترسی (Quota Exceeded)**\n\n` +
                    (isGemini3 
                        ? `مدل **${model}** (یا قابلیت جستجو) در حالت رایگان (Free Tier) سهمیه‌ای ندارد (Limit: 0).\n\n`
                        : `سقف استفاده رایگان شما برای مدل **${model}** پر شده است.\n\n`) +
                    `**راه حل:**\n` +
                    `۱. برای استفاده از مدل‌های Gemini 3.0 Pro، باید قابلیت پرداخت (Billing) را در [Google Cloud Console](https://console.cloud.google.com/) برای پروژه خود فعال کنید.\n` +
                    `۲. یا مدل را به **Gemini Flash** تغییر دهید که سهمیه رایگان بالایی دارد.\n` +
                    `۳. ممکن است نیاز باشد کلید API جدیدی بسازید.`;
            } else if (errorMessage.includes('API_KEY')) {
                 friendlyError = `\n\n**کلید API نامعتبر است.** لطفا کلید خود را بررسی کنید.`;
            }

            if (abortControllerRef.current?.signal.aborted) {
                 updateMessageById(activeSessionId, messageId, { content: "\n\n(تولید توسط کاربر متوقف شد)" });
            } else {
                updateMessageById(activeSessionId, messageId, { 
                    content: friendlyError || `\n\nمتاسفانه خطایی رخ داد:\n\`\`\`json\n${errorMessage}\n\`\`\`` 
                });
            }
        } finally {
            const endTime = Date.now();
            updateMessageById(activeSessionId, messageId, { generationTime: (endTime - startTime) / 1000 });
            abortControllerRef.current = null;
        }
    };

    const generateTextResponse = useCallback(async (activeSessionId: string, history: ChatMessage[], messageId: string, useWebSearch: boolean) => {
        await handleApiCall(activeSessionId, messageId, async () => {
            const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY as string });
            const contents = buildApiContents(history);
            
            let modelForApi = model as string;
            let currentSystemInstruction = systemInstruction;

            if (useWebSearch) {
                modelForApi = 'gemini-3-pro-preview';
            }

            const config: any = { systemInstruction: currentSystemInstruction };
            if (useWebSearch) {
                config.tools = [{ googleSearch: {} }];
            }

            const stream = await ai.models.generateContentStream({
                model: modelForApi,
                contents,
                config,
            });

            for await (const chunk of stream) {
                if (abortControllerRef.current?.signal.aborted) break;
                const text = chunk.text;
                const metadata = chunk.candidates?.[0]?.groundingMetadata;
                const chunks = metadata?.groundingChunks as GroundingChunk[] | undefined;
                updateMessageById(activeSessionId, messageId, { content: text, groundingChunks: chunks });
            }
        });
    }, [model, systemInstruction, handleApiCall, updateMessageById, apiKey]);
    
    const generateImageResponse = useCallback(async (activeSessionId: string, history: ChatMessage[], messageId: string, modelName: string) => {
        await handleApiCall(activeSessionId, messageId, async () => {
            const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY as string });
            const contents = buildApiContents(history);

            const response = await ai.models.generateContent({
                model: modelName,
                contents: contents,
            });

            const candidate = response.candidates?.[0];
            let imagePartFound = false;
            let textContent = '';
            const generatedAttachments: ChatAttachment[] = [];

            if (candidate?.content?.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData) {
                        generatedAttachments.push({
                            type: 'image', 
                            name: `generated-image-${Date.now()}.png`,
                            data: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                            mimeType: part.inlineData.mimeType,
                        });
                        imagePartFound = true;
                    }
                    if (part.text) textContent += part.text;
                }
            }

            // Update with all generated images
            if (generatedAttachments.length > 0) {
                updateMessageById(activeSessionId, messageId, { attachments: generatedAttachments });
            }

            if (textContent) updateMessageById(activeSessionId, messageId, { content: textContent });
            
            if (!imagePartFound && !textContent) {
                const fallbackText = response.text || "Sorry, I couldn't generate a response. Please try a different prompt.";
                updateMessageById(activeSessionId, messageId, { content: fallbackText });
            }
        });
    }, [handleApiCall, updateMessageById, apiKey]);

    const generateSpeechResponse = useCallback(async (activeSessionId: string, history: ChatMessage[], messageId: string) => {
        await handleApiCall(activeSessionId, messageId, async () => {
            const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY as string });
            const lastUserMessage = history[history.length - 1].content;
            if (!lastUserMessage) {
                updateMessageById(activeSessionId, messageId, { content: "لطفا متنی برای تبدیل به گفتار وارد کنید." });
                return;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-tts',
                contents: [{ parts: [{ text: lastUserMessage }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: ttsVoice } } },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const audioOutput: AudioOutput = {
                    data: `data:audio/pcm;base64,${base64Audio}`, mimeType: 'audio/pcm',
                };
                updateMessageById(activeSessionId, messageId, { audioOutput: audioOutput });
            } else {
                const fallbackText = response.text || "متاسفانه نتوانستم صدا را تولید کنم.";
                updateMessageById(activeSessionId, messageId, { content: fallbackText });
            }
        });
    }, [ttsVoice, handleApiCall, updateMessageById, apiKey]);

    const callApiModel = useCallback(async (activeSessionId: string, history: ChatMessage[], message: string, attachments: ChatAttachment[] | null) => {
        setIsLoading(true);
        setGenerationStartTime(Date.now());

        const userMessage: ChatMessage = {
            id: uuidv4(), role: ChatRole.USER, content: message,
            createdAt: Date.now(), attachments: attachments || [],
        };
        addMessageToSession(activeSessionId, userMessage);
        
        const historyForApi = [...history, userMessage];

        const modelMessageId = uuidv4();
        addMessageToSession(activeSessionId, {
            id: modelMessageId, role: ChatRole.MODEL, content: '',
            createdAt: Date.now(),
        });
        
        const generationPromises: Promise<void>[] = [];
        
        if (model === 'gemini-2.5-flash-image') {
            generationPromises.push(generateImageResponse(activeSessionId, historyForApi, modelMessageId, model));
        } else if (model === 'gemini-2.5-flash-preview-tts') {
            generationPromises.push(generateSpeechResponse(activeSessionId, historyForApi, modelMessageId));
        } else {
            const useWebSearch = model === 'web-search';
            for (let i = 0; i < candidateCount; i++) {
                const perCandidateMessageId = i === 0 ? modelMessageId : uuidv4();
                if (i > 0) {
                    addMessageToSession(activeSessionId, {
                        id: perCandidateMessageId, role: ChatRole.MODEL, content: '',
                        createdAt: Date.now() + i,
                    });
                }
                generationPromises.push(generateTextResponse(activeSessionId, historyForApi, perCandidateMessageId, useWebSearch));
            }
        }

        await Promise.all(generationPromises);
        setIsLoading(false);
        setGenerationStartTime(null);
    }, [addMessageToSession, candidateCount, generateImageResponse, generateSpeechResponse, generateTextResponse, model]);

    const handleFireAiGeneration = useCallback(async (activeSessionId: string, history: ChatMessage[], message: string, attachments: ChatAttachment[] | null) => {
        setIsLoading(true);
        setGenerationStartTime(Date.now());
        abortControllerRef.current = new AbortController();
        
        const FIRE_AI_COUNT = 15;

        // 1. Add User Message
        const userMessageId = uuidv4();
        const userMessage: ChatMessage = {
            id: userMessageId, role: ChatRole.USER, content: message,
            createdAt: Date.now(), attachments: attachments || [],
        };
        addMessageToSession(activeSessionId, userMessage);
        
        // 2. Prepare API Inputs
        const historyForApi = [...history, userMessage];
        const apiContents = buildApiContents(historyForApi);
        
        // 3. Add Initial Model Message with FireAI State
        const modelMessageId = uuidv4();
        const initialResponsesState: FireAiState['initialResponses'] = Array.from({ length: FIRE_AI_COUNT }, (_, i) => ({ 
            id: i, 
            content: null, 
            status: 'pending' 
        }));
        
        addMessageToSession(activeSessionId, {
            id: modelMessageId, role: ChatRole.MODEL, content: '', createdAt: Date.now(),
            fireAiState: {
                phase: 'generating',
                initialResponses: initialResponsesState,
                progress: 0,
            }
        });

        const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY as string });
        let completedCount = 0;
        const localResponses = [...initialResponsesState];

        // 4. Helper function for single generation
        const generateSingle = async (index: number) => {
            try {
                let modelForApi = model as string;
                let currentSystemInstruction = systemInstruction;

                const result = await ai.models.generateContent({
                    model: modelForApi,
                    contents: apiContents,
                    config: { 
                        temperature: 1.0, // High temperature for maximum diversity
                        systemInstruction: currentSystemInstruction 
                    }
                });
                
                // FIX: Use result.text instead of result.response.text
                const text = result.text;
                if (text) {
                    localResponses[index] = { id: index, content: text, status: 'complete' };
                } else {
                    localResponses[index] = { id: index, content: null, status: 'complete' };
                }
            } catch (e) {
                console.error(`FireAI Generation ${index} failed:`, e);
                localResponses[index] = { id: index, content: null, status: 'complete' };
            } finally {
                completedCount++;
                updateFireAiState(activeSessionId, modelMessageId, {
                    phase: 'generating',
                    initialResponses: [...localResponses],
                    progress: completedCount
                });
            }
        };

        try {
            // 5. Run Sequential Generations (One by One)
            for (let i = 0; i < FIRE_AI_COUNT; i++) {
                if (abortControllerRef.current?.signal.aborted) {
                    throw new Error("FireAI Process Stopped by User");
                }
                await generateSingle(i);
            }

            if (abortControllerRef.current?.signal.aborted) {
                throw new Error("FireAI Process Stopped by User");
            }

            // 6. Move to Synthesis Phase
            updateFireAiState(activeSessionId, modelMessageId, {
                phase: 'synthesizing',
                initialResponses: [...localResponses],
                progress: FIRE_AI_COUNT
            });

            // Filter valid responses
            const validContent = localResponses
                .map(r => r.content)
                .filter(c => c !== null && c.trim().length > 0);
            
            if (validContent.length === 0) {
                throw new Error("No valid content generated from threads.");
            }

            // 7. Construct Synthesis Prompt
            const synthesisPrompt = `
I have generated ${validContent.length} different responses to the following user prompt: "${message}".

Here are the generated responses:
${validContent.map((c, i) => `--- RESPONSE ${i + 1} ---\n${c}\n`).join('\n')}

**MISSION:**
You are the "FireAI" Synthesizer. Your goal is to create the Ultimate Master Response.
1.  **Comprehensive Coverage:** You must include EVERY unique detail, fact, code snippet, concept, or creative idea found in ALL of the responses above. Do not leave anything out.
2.  **Merge Duplicates:** If multiple responses say the same thing, merge them into a single clear explanation. Do not repeat yourself, but do not delete unique info.
3.  **Structure:** Use professional Markdown (headers, bullet points, code blocks) to organize this massive amount of information.
4.  **Language:** Respond in the same language as the user's prompt (Persian/Farsi).
5.  **Tone:** Comprehensive, authoritative, and complete.

Combine them into one single, perfect response now.
            `;

            // 8. Stream Synthesis Response
            let synthesisModel = 'gemini-3-pro-preview'; 
            
            const synthesisStream = await ai.models.generateContentStream({
                model: synthesisModel,
                contents: [{ role: 'user', parts: [{ text: synthesisPrompt }] }],
            });

            let fullText = '';
            for await (const chunk of synthesisStream) {
                if (abortControllerRef.current?.signal.aborted) break;
                const chunkText = chunk.text;
                if (chunkText) {
                    fullText += chunkText;
                    // Once we start streaming text, we remove the fireAiState to show the text content
                    updateFireAiState(activeSessionId, modelMessageId, undefined, fullText);
                }
            }

        } catch (error: any) {
            console.error("FireAI Error:", error);
            
            let errorMessage = error instanceof Error ? error.message : String(error);
            let friendlyError = '';
            
            // Similar error handling for FireAI
            if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                friendlyError = `\n\n**خطای محدودیت (Quota)**: به نظر می‌رسد سهمیه مدل Gemini 3.0 Pro برای پردازش FireAI کافی نیست یا نیاز به فعال‌سازی Billing دارد.`;
            }

            if (abortControllerRef.current?.signal.aborted) {
                 updateFireAiState(activeSessionId, modelMessageId, undefined, 
                    "فرآیند FireAI توسط کاربر متوقف شد.\n\n"
                 );
            } else {
                updateFireAiState(activeSessionId, modelMessageId, undefined, 
                    friendlyError || ("متاسفانه خطایی در فرآیند FireAI رخ داد. لطفا دوباره تلاش کنید.\n\n" + errorMessage)
                );
            }
        } finally {
            setIsLoading(false);
            setGenerationStartTime(null);
            abortControllerRef.current = null;
        }

    }, [addMessageToSession, updateFireAiState, model, systemInstruction, apiKey]);

    return {
        isLoading,
        generationStartTime,
        callApiModel,
        handleFireAiGeneration,
        stopGeneration,
    };
};
