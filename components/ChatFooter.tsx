
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
    onSendMessage: (message: string, attachments: ChatAttachment[]) => void;
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
    const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
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
        if (isLoading && attachments.length === 0) return;
        if (prompt.trim() || attachments.length > 0) {
            onSendMessage(prompt, attachments);
            setPrompt('');
            setAttachments([]);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newAttachments: ChatAttachment[] = [];
            for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];
                const processedFile = await processFile(file);
                if (processedFile) {
                    newAttachments.push(processedFile);
                }
            }
            setAttachments(prev => [...prev, ...newAttachments]);
            e.target.value = ''; // Reset file input
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };
    
    return (
        <div className="flex-shrink-0 bg-light-bg dark:bg-dark-bg pt-2 w-full z-20">
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

                <div className="w-full bg-light-sidebar dark:bg-dark-sidebar rounded-3xl p-2 flex items-end gap-2 border border-light-border dark:border-dark-border focus-within:ring-2 focus-within:ring-gemini-blue transition-shadow shadow-sm">
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
                        multiple // Enable multiple file selection
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    
                    <div className="flex-1 flex flex-col min-w-0">
                        {attachments.length > 0 && (
                            <div className="flex gap-3 overflow-x-auto py-3 px-1 w-full mb-1 touch-pan-x" style={{ scrollbarWidth: 'thin' }}>
                                {attachments.map((file, index) => (
                                    <div key={index} className="relative flex-shrink-0 group">
                                        <div className="w-20 h-20 rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg overflow-hidden flex items-center justify-center relative">
                                            {file.type === 'image' ? (
                                                <img src={file.data} alt={file.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-light-text-secondary dark:text-dark-text-secondary p-2">
                                                    <AttachmentIcon className="w-8 h-8 mb-1" />
                                                </div>
                                            )}
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-[2px] text-white text-[9px] px-1 py-0.5 truncate text-center">
                                                {file.name}
                                            </div>
                                        </div>
                                        
                                        {/* Single Delete Button */}
                                        <button 
                                            onClick={() => removeAttachment(index)} 
                                            className="absolute -top-2 -left-2 bg-light-sidebar dark:bg-dark-sidebar text-red-500 rounded-full p-1 shadow-md border border-light-border dark:border-dark-border hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors z-10"
                                            title="حذف"
                                        >
                                            <CloseIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <textarea
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="پیامت رو بنویس..."
                            rows={1}
                            className="w-full bg-transparent p-2.5 resize-none focus:outline-none placeholder:text-light-text-secondary placeholder:dark:text-dark-text-secondary max-h-48 text-light-text-primary dark:text-dark-text-primary"
                        />
                    </div>
                    
                    <button
                        onClick={handleSend}
                        disabled={isLoading || (!prompt.trim() && attachments.length === 0)}
                        className="p-3 bg-dark-bubble-user text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 flex-shrink-0"
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
