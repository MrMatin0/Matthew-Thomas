import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChatAttachment, Model } from '../types';
import { processFile } from '../utils/file-helpers';
import { AttachmentIcon } from './icons/AttachmentIcon';
import { SendIcon } from './icons/SendIcon';
import { StopIcon } from './icons/StopIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { CloseIcon } from './icons/CloseIcon';
import { MultipleResponsesIcon } from './icons/MultipleResponsesIcon';
import { FireIcon } from './icons/FireIcon';
import { CandidateSelector } from './CandidateSelector';


interface ChatFooterProps {
    onSendMessage: (message: string, attachment?: ChatAttachment | null) => void;
    isLoading: boolean;
    onStopGeneration: () => void;
    onRegenerateResponse: () => void;
    canRegenerate: boolean;
    candidateCount: number;
    onCandidateCountChange: (count: number) => void;
    isFireAiActive: boolean;
    onToggleFireAi: () => void;
    model: Model;
}

// FIX: Refactor to a standard function component to avoid potential type issues with libraries like framer-motion.
const ChatFooter = ({ 
    onSendMessage, 
    isLoading, 
    onStopGeneration, 
    onRegenerateResponse, 
    canRegenerate,
    candidateCount,
    onCandidateCountChange,
    isFireAiActive,
    onToggleFireAi,
    model
}: ChatFooterProps) => {
    const [prompt, setPrompt] = useState('');
    const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
    const [isCandidateSelectorOpen, setIsCandidateSelectorOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isFireAiCompatible = model !== 'gemini-2.5-flash-preview-tts' && model !== 'web-search';

    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
        }
    }, []);

    useEffect(() => {
        adjustTextareaHeight();
    }, [prompt, adjustTextareaHeight]);

    const handleSend = () => {
        if (isLoading && !attachment) return;
        if (prompt.trim() || attachment) {
            onSendMessage(prompt, attachment);
            setPrompt('');
            setAttachment(null);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const processedFile = await processFile(file);
            setAttachment(processedFile);
            e.target.value = ''; // Reset file input
        }
    };
    
    return (
        <div className="flex-shrink-0 bg-light-bg dark:bg-dark-bg pt-2">
            <div className="relative w-full max-w-4xl mx-auto px-4 flex flex-col items-center">
                {isLoading ? (
                    <button 
                        onClick={onStopGeneration}
                        className="mb-3 flex items-center gap-2 px-4 py-2 text-sm font-medium bg-light-bubble-model dark:bg-dark-bubble-model rounded-lg hover:opacity-80 transition-opacity"
                    >
                        <StopIcon className="w-4 h-4" />
                        توقف تولید
                    </button>
                ) : (
                    canRegenerate && (
                        <button 
                            onClick={onRegenerateResponse}
                            className="mb-3 flex items-center gap-2 px-4 py-2 text-sm font-medium bg-light-bubble-model dark:bg-dark-bubble-model rounded-lg hover:opacity-80 transition-opacity"
                        >
                            <RefreshIcon className="w-4 h-4" />
                           تولید مجدد پاسخ
                        </button>
                    )
                )}

                <AnimatePresence>
                    {isCandidateSelectorOpen && (
                        <CandidateSelector
                            count={candidateCount}
                            onChange={onCandidateCountChange}
                            onClose={() => setIsCandidateSelectorOpen(false)}
                        />
                    )}
                </AnimatePresence>

                <div className="w-full bg-light-sidebar dark:bg-dark-sidebar rounded-4xl p-2 flex items-end gap-2 border border-light-border dark:border-dark-border focus-within:ring-2 focus-within:ring-gemini-blue transition-shadow shadow-sm">
                    <div className="relative">
                        <button 
                            onClick={() => setIsCandidateSelectorOpen(prev => !prev)}
                            className="p-3 text-light-text-secondary dark:text-dark-text-secondary hover:text-gemini-blue dark:hover:text-gemini-blue transition-colors rounded-full"
                            aria-label="Generate multiple responses"
                        >
                            <MultipleResponsesIcon className="w-6 h-6" />
                        </button>
                        {candidateCount > 1 && (
                             <div className="absolute -top-1 -right-1 w-4 h-4 bg-gemini-blue text-white text-[10px] font-bold flex items-center justify-center rounded-full pointer-events-none">
                                {candidateCount}
                            </div>
                        )}
                    </div>
                     <button
                        onClick={onToggleFireAi}
                        disabled={!isFireAiCompatible}
                        className={`p-3 rounded-full transition-all duration-300 relative ${
                            isFireAiActive
                                ? 'text-white bg-gradient-to-br from-red-500 to-orange-400 shadow-lg shadow-orange-500/50 animate-flicker'
                                : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-orange-500 dark:hover:text-orange-400'
                        } ${!isFireAiCompatible ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-label={isFireAiCompatible ? "فعال‌سازی FireAI برای پاسخ عمیق‌تر و دقیق‌تر" : "FireAI برای این مدل در دسترس نیست"}
                        title={isFireAiCompatible ? "فعال‌سازی FireAI برای پاسخ عمیق‌تر و دقیق‌تر" : "FireAI برای این مدل در دسترس نیست"}
                    >
                        <FireIcon className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-light-text-secondary dark:text-dark-text-secondary hover:text-gemini-blue dark:hover:text-gemini-blue transition-colors rounded-full"
                        aria-label="Attach file"
                    >
                        <AttachmentIcon className="w-6 h-6" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    
                    <div className="flex-1 flex flex-col">
                        {attachment && (
                            <div className="mb-2 px-3 py-1.5 bg-light-bg dark:bg-dark-bg rounded-lg text-sm flex items-center justify-between gap-2 border border-light-border dark:border-dark-border animate-fade-in">
                                <span className="truncate">{attachment.name}</span>
                                <button onClick={() => setAttachment(null)} className="p-1 rounded-full hover:bg-light-bubble-model dark:hover:bg-dark-bubble-model">
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <textarea
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="پیامت رو بنویس..."
                            rows={1}
                            className="w-full bg-transparent p-2.5 resize-none focus:outline-none placeholder:text-light-text-secondary placeholder:dark:text-dark-text-secondary max-h-48"
                        />
                    </div>
                    
                    <button
                        onClick={handleSend}
                        disabled={isLoading || (!prompt.trim() && !attachment)}
                        className="p-3 bg-dark-bubble-user text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                        aria-label="Send message"
                    >
                        <SendIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
            <p className="text-center text-xs text-light-text-secondary dark:text-dark-text-secondary py-3 px-4">
                Gemini ممکن است اطلاعات نادرستی را نمایش دهد، از جمله در مورد افراد، بنابراین پاسخ‌های آن را دوباره بررسی کنید.
            </p>
        </div>
    );
};

export default ChatFooter;