
// FIX: Implement the main App component to provide application structure and logic.
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatBubble } from './components/ChatBubble';
import ChatFooter from './components/ChatFooter';
import { LoadingIndicator } from './components/LoadingIndicator';
import { SettingsModal } from './components/SettingsModal';
import { HamburgerIcon } from './components/icons/HamburgerIcon';
import { ModelSelector } from './components/ModelSelector';
import { ChatAttachment, Theme, Model, ALL_MODELS, TtsVoice, ChatRole } from './types';
import { BotIcon } from './components/icons/BotIcon';
import { CheckIcon } from './components/icons/CheckIcon';

import { useTheme } from './hooks/useTheme';
import { useSessions } from './hooks/useSessions';
import { useGemini } from './hooks/useGemini';

const DEFAULT_SYSTEM_INSTRUCTION = 'You are Gemini, a helpful and creative AI assistant. Respond in markdown format when appropriate.';
const DEFAULT_MODEL: Model = 'gemini-flash-latest';
const DEFAULT_TTS_VOICE: TtsVoice = 'Kore';

const App: React.FC = () => {
    // App-level configuration state
    const [apiKey, setApiKey] = useState<string>(() => {
        return process.env.API_KEY || localStorage.getItem('gemini_api_key') || '';
    });
    const [hasApiKey, setHasApiKey] = useState(false);
    const [tempApiKey, setTempApiKey] = useState('');

    const [systemInstruction, setSystemInstruction] = useState(DEFAULT_SYSTEM_INSTRUCTION);
    const [model, setModel] = useState<Model>(DEFAULT_MODEL);
    const [ttsVoice, setTtsVoice] = useState<TtsVoice>(DEFAULT_TTS_VOICE);
    const [candidateCount, setCandidateCount] = useState<number>(1);
    const [isFireAiActive, setIsFireAiActive] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const chatContainerRef = React.useRef<HTMLDivElement>(null);

    // Custom Hooks for major functionalities
    const [theme, toggleTheme] = useTheme();
    const { 
        sessions, activeSession, activeSessionId,
        handleNewChat, handleSelectSession, handleDeleteSession, handleRenameSession,
        addMessageToSession, updateMessageById, updateFireAiState, setMessagesForSession
    } = useSessions(systemInstruction, model);

    const { 
        isLoading, generationStartTime, callApiModel, 
        handleFireAiGeneration, stopGeneration 
    } = useGemini({ 
        model, ttsVoice, systemInstruction, candidateCount,
        addMessageToSession, updateMessageById, updateFireAiState,
        apiKey
    });

    // Check for API Key on mount
    useEffect(() => {
        const checkApiKey = async () => {
            // If running in an environment where process.env.API_KEY is already set (e.g. local dev with .env)
            if (apiKey) {
                setHasApiKey(true);
                return;
            }
            // Check AI Studio environment
            if (window.aistudio) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setHasApiKey(hasKey);
            }
        };
        checkApiKey();
    }, [apiKey]);
    
    // Save API key to local storage whenever it changes
    useEffect(() => {
        if (apiKey) {
            localStorage.setItem('gemini_api_key', apiKey);
        }
    }, [apiKey]);

    const handleApiKeySelection = async () => {
        if (window.aistudio) {
            try {
                await window.aistudio.openSelectKey();
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setHasApiKey(hasKey);
            } catch (error) {
                console.error("API Key selection failed:", error);
            }
        } else {
            alert("API Key selection is not available in this environment. Please enter your API key manually.");
        }
    };

    const handleManualKeySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (tempApiKey.trim()) {
            setApiKey(tempApiKey.trim());
            setHasApiKey(true);
        }
    };

    // Load app configuration from localStorage on initial mount
    useEffect(() => {
        try {
            const savedInstruction = localStorage.getItem('systemInstruction');
            const savedModel = localStorage.getItem('model') as Model;
            const savedTtsVoice = localStorage.getItem('ttsVoice') as TtsVoice;
            if (savedInstruction) setSystemInstruction(savedInstruction);
            if (savedTtsVoice) setTtsVoice(savedTtsVoice);
            if (savedModel && ALL_MODELS.includes(savedModel)) setModel(savedModel);
        } catch (error) {
            console.error("Failed to load app config from localStorage:", error);
        }
    }, []);

    // Save app configuration to localStorage when it changes
    useEffect(() => {
        try {
            localStorage.setItem('systemInstruction', systemInstruction);
            localStorage.setItem('model', model);
            localStorage.setItem('ttsVoice', ttsVoice);
        } catch (error) {
            console.error("Failed to save app config to localStorage:", error);
        }
    }, [systemInstruction, model, ttsVoice]);

    // Auto-scroll chat container
    useEffect(() => {
        const chatContainer = chatContainerRef.current;
        if (!chatContainer) return;

        const scrollThreshold = 100;
        const isScrolledToBottom = chatContainer.scrollHeight - chatContainer.clientHeight <= chatContainer.scrollTop + scrollThreshold;
        
        if (isScrolledToBottom) {
            chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
        }
    }, [activeSession?.messages]);
    
    // Deactivate FireAI if an incompatible model is selected
    useEffect(() => {
        const isFireAiCompatible = model !== 'gemini-2.5-flash-preview-tts' && model !== 'web-search';
        if (!isFireAiCompatible && isFireAiActive) {
            setIsFireAiActive(false);
        }
    }, [model, isFireAiActive]);

    const handleSendMessage = (message: string, attachment: ChatAttachment | null) => {
        if (!activeSessionId || !activeSession) return;
        const historyForApi = [...activeSession.messages];
        if (isFireAiActive) {
            handleFireAiGeneration(activeSessionId, historyForApi, message, attachment);
            setIsFireAiActive(false); // Deactivate after one use
        } else {
            callApiModel(activeSessionId, historyForApi, message, attachment);
        }
    };

    const handleRegenerateResponse = () => {
        if (!activeSessionId || !activeSession || isLoading) return;

        const messagesWithoutLastModelResponse = [...activeSession.messages];
        while (messagesWithoutLastModelResponse.length > 0 && messagesWithoutLastModelResponse[messagesWithoutLastModelResponse.length - 1].role === ChatRole.MODEL) {
            messagesWithoutLastModelResponse.pop();
        }

        const lastUserMessage = [...messagesWithoutLastModelResponse].reverse().find(m => m.role === ChatRole.USER);
        if (lastUserMessage) {
            setMessagesForSession(activeSessionId, messagesWithoutLastModelResponse);
            // Re-use the last user message to call the API
            callApiModel(activeSessionId, messagesWithoutLastModelResponse, lastUserMessage.content, lastUserMessage.attachment || null);
        }
    };
    
    const handleSaveSettings = (newInstruction: string) => {
        setSystemInstruction(newInstruction);
        handleNewChat();
    };

    const onNewChat = useCallback(() => {
        handleNewChat();
        setIsMobileDrawerOpen(false);
    }, [handleNewChat]);

    const onSelectSession = useCallback((id: string) => {
        handleSelectSession(id);
        setIsMobileDrawerOpen(false);
    }, [handleSelectSession]);

    const canRegenerate = activeSession?.messages.some(m => m.role === ChatRole.MODEL) || false;

    if (!hasApiKey) {
        return (
            <div className="flex items-center justify-center h-screen bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary p-4">
                <div className="max-w-md w-full bg-light-sidebar dark:bg-dark-sidebar p-8 rounded-3xl shadow-2xl text-center border border-light-border dark:border-dark-border animate-fade-in">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gemini-blue to-gemini-violet rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                        <BotIcon className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold mb-3">خوش آمدید</h1>
                    <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
                        برای شروع استفاده از هوش مصنوعی Gemini، لطفاً کلید API خود را متصل کنید.
                    </p>
                    
                    {/* Google Auth Button */}
                    <button 
                        onClick={handleApiKeySelection}
                        className="w-full py-3.5 px-6 mb-4 bg-gemini-blue hover:bg-gemini-blue/90 text-white font-bold rounded-xl transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2"
                    >
                         <span>اتصال حساب گوگل (AI Studio)</span>
                    </button>
                    
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-light-border dark:border-dark-border"></div>
                        <span className="flex-shrink-0 mx-4 text-light-text-secondary dark:text-dark-text-secondary text-xs">یا</span>
                        <div className="flex-grow border-t border-light-border dark:border-dark-border"></div>
                    </div>

                    {/* Manual API Key Input */}
                    <form onSubmit={handleManualKeySubmit} className="mt-4">
                        <label className="block text-right text-xs text-light-text-secondary dark:text-dark-text-secondary mb-2 pr-1">
                            وارد کردن دستی کلید API:
                        </label>
                        <div className="flex gap-2">
                            <input 
                                type="password" 
                                value={tempApiKey}
                                onChange={(e) => setTempApiKey(e.target.value)}
                                className="flex-1 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-gemini-blue outline-none text-sm transition-all"
                                placeholder="کلید API خود را اینجا وارد کنید..."
                            />
                            <button 
                                type="submit"
                                disabled={!tempApiKey.trim()}
                                className="bg-light-bubble-model dark:bg-dark-bubble-model hover:bg-green-500/20 hover:text-green-500 disabled:opacity-50 disabled:cursor-not-allowed p-3 rounded-xl transition-all border border-transparent hover:border-green-500/50"
                                aria-label="Save API Key"
                            >
                                <CheckIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="mt-3 text-[10px] text-light-text-secondary dark:text-dark-text-secondary text-right">
                           کلید API شما فقط در مرورگر ذخیره می‌شود و به سرور ما ارسال نمی‌گردد.
                           <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-gemini-blue mr-1">
                               دریافت کلید API
                           </a>
                        </p>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex h-screen overflow-hidden bg-light-bg dark:bg-dark-bg font-sans`}>
            <Sidebar 
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={onSelectSession}
                onDeleteSession={handleDeleteSession}
                onRenameSession={handleRenameSession}
                onNewChat={onNewChat}
                onSettingsOpen={() => setIsSettingsOpen(true)}
                isMobileDrawerOpen={isMobileDrawerOpen}
                onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
                theme={theme}
                onToggleTheme={toggleTheme}
            />

            <main className="flex-1 flex flex-col relative">
                <header className="flex-shrink-0 h-16 flex items-center justify-between px-4 border-b border-light-border dark:border-dark-border">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsMobileDrawerOpen(true)} className="lg:hidden p-2 -ml-2">
                            <HamburgerIcon className="w-6 h-6 text-light-text-primary dark:text-dark-text-primary"/>
                        </button>
                        <h1 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary truncate">
                            {activeSession?.title || 'Gemini Chat'}
                        </h1>
                    </div>
                    <ModelSelector selectedModel={model} onSelectModel={setModel} />
                </header>

                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    {activeSession?.messages.map((msg) => (
                        <ChatBubble key={msg.id} message={msg} />
                    ))}
                    {isLoading && !activeSession?.messages.some(m => m.fireAiState) && <LoadingIndicator startTime={generationStartTime} />}
                </div>

                <ChatFooter 
                    onSendMessage={handleSendMessage} 
                    isLoading={isLoading}
                    onStopGeneration={stopGeneration}
                    onRegenerateResponse={handleRegenerateResponse}
                    canRegenerate={canRegenerate && !isLoading}
                    candidateCount={candidateCount}
                    onCandidateCountChange={setCandidateCount}
                    isFireAiActive={isFireAiActive}
                    onToggleFireAi={() => setIsFireAiActive(prev => !prev)}
                    model={model}
                />
            </main>
            
            <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onSave={handleSaveSettings}
                currentInstruction={systemInstruction}
                currentTtsVoice={ttsVoice}
                onTtsVoiceChange={setTtsVoice}
                apiKey={apiKey}
            />
        </div>
    );
};

export default App;
