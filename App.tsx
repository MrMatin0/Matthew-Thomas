
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

import { useTheme } from './hooks/useTheme';
import { useSessions } from './hooks/useSessions';
import { useGemini } from './hooks/useGemini';

const DEFAULT_SYSTEM_INSTRUCTION = 'You are Gemini, a helpful and creative AI assistant. Respond in markdown format when appropriate.';
const DEFAULT_MODEL: Model = 'gemini-flash-latest';
const DEFAULT_TTS_VOICE: TtsVoice = 'Kore';

const App: React.FC = () => {
    // App-level configuration state
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
        addMessageToSession, updateMessageById, updateFireAiState 
    });

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
            />
        </div>
    );
};

export default App;
