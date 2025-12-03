
import { useState, useEffect, useCallback } from 'react';
import { ChatSession, ChatMessage, Model, FireAiState, AudioOutput, ChatAttachment } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const useSessions = (systemInstruction: string, model: Model) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    const handleNewChat = useCallback(() => {
        const newSession: ChatSession = {
            id: uuidv4(),
            title: 'گفت‌وگوی جدید',
            messages: [],
            systemInstruction: systemInstruction,
            model: model
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        return newSession.id;
    }, [systemInstruction, model]);

    useEffect(() => {
        try {
            const savedSessions = localStorage.getItem('chatSessions');
            const savedActiveId = localStorage.getItem('activeChatSessionId');
            let loadedSessions: ChatSession[] = [];

            if (savedSessions) {
                const parsedSessions: any[] = JSON.parse(savedSessions);
                // Migration logic: convert single attachment to attachments array
                loadedSessions = parsedSessions.map(session => ({
                    ...session,
                    messages: session.messages.map((message: any) => {
                        if (!message.id) message.id = uuidv4();
                        if (message.fireAiState) message.fireAiState = undefined;
                        
                        // Handle legacy attachment field
                        if (message.attachment && !message.attachments) {
                            message.attachments = [message.attachment];
                            delete message.attachment;
                        } else if (!message.attachments) {
                            message.attachments = [];
                        }
                        return message as ChatMessage;
                    })
                }));
                
                setSessions(loadedSessions);

                if (savedActiveId && loadedSessions.some(s => s.id === savedActiveId)) {
                    setActiveSessionId(savedActiveId);
                } else if (loadedSessions.length > 0) {
                    setActiveSessionId(loadedSessions[0].id);
                }
            }
            
            if (loadedSessions.length === 0) {
                handleNewChat();
            }

        } catch (error) {
            console.error("Failed to load sessions from localStorage:", error);
            handleNewChat();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        try {
            if (sessions.length > 0) {
                localStorage.setItem('chatSessions', JSON.stringify(sessions));
            }
            if (activeSessionId) {
                localStorage.setItem('activeChatSessionId', activeSessionId);
            }
        } catch (error) {
            console.error("Failed to save sessions to localStorage:", error);
        }
    }, [sessions, activeSessionId]);

    const handleSelectSession = useCallback((id: string) => {
        setActiveSessionId(id);
    }, []);

    const handleDeleteSession = useCallback((id: string) => {
        setSessions(prev => {
            const remaining = prev.filter(s => s.id !== id);
            if (activeSessionId === id) {
                if (remaining.length > 0) {
                    setActiveSessionId(remaining[0].id);
                } else {
                    handleNewChat();
                }
            }
            return remaining;
        });
    }, [activeSessionId, handleNewChat]);

    const handleRenameSession = useCallback((id: string, newTitle: string) => {
        setSessions(prev => prev.map(s => (s.id === id ? { ...s, title: newTitle } : s)));
    }, []);

    const addMessageToSession = useCallback((sessionId: string, message: ChatMessage) => {
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                return { ...s, messages: [...s.messages, message] };
            }
            return s;
        }));
    }, []);

    const updateMessageById = useCallback((sessionId: string, messageId: string, updates: Partial<Pick<ChatMessage, 'content' | 'attachments' | 'groundingChunks' | 'generationTime' | 'audioOutput'>>) => {
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                const newMessages = s.messages.map(m => {
                    if (m.id === messageId) {
                        return {
                            ...m,
                            content: updates.content !== undefined ? m.content + updates.content : m.content,
                            attachments: updates.attachments !== undefined ? updates.attachments : m.attachments,
                            audioOutput: updates.audioOutput !== undefined ? updates.audioOutput : m.audioOutput,
                            generationTime: updates.generationTime !== undefined ? updates.generationTime : m.generationTime,
                            groundingChunks: updates.groundingChunks ?
                                [...(m.groundingChunks || [])]
                                    .concat(updates.groundingChunks)
                                    .filter((v, i, a) => a.findIndex(t => (t.web.uri === v.web.uri)) === i)
                                : m.groundingChunks,
                        };
                    }
                    return m;
                });
                return { ...s, messages: newMessages };
            }
            return s;
        }));
    }, []);
    
    const updateFireAiState = useCallback((sessionId: string, messageId: string, fireAiState: FireAiState | undefined, content?: string) => {
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                return {
                    ...s,
                    messages: s.messages.map(m =>
                        m.id === messageId ? { ...m, fireAiState, ...(content !== undefined && { content }) } : m
                    )
                };
            }
            return s;
        }));
    }, []);
    
    const setMessagesForSession = useCallback((sessionId: string, messages: ChatMessage[]) => {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages } : s));
    }, []);

    const activeSession = sessions.find(s => s.id === activeSessionId);

    return {
        sessions,
        activeSessionId,
        activeSession,
        handleNewChat,
        handleSelectSession,
        handleDeleteSession,
        handleRenameSession,
        addMessageToSession,
        updateMessageById,
        updateFireAiState,
        setMessagesForSession,
    };
};
