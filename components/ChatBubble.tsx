
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
// FIX: Correct import for types from the root directory.
import { ChatMessage, ChatRole } from '../types';
import { BotIcon } from './icons/BotIcon';
import { UserIcon } from './icons/UserIcon';
import { CopyIcon } from './icons/CopyIcon';
import { FireAiProcessVisualizer } from './FireAiProcessVisualizer';
import { CodeBlock } from './chat/CodeBlock';
import { AttachmentRenderer } from './chat/AttachmentRenderer';
import { GroundingSources } from './chat/GroundingSources';
import { AudioPlayer } from './chat/AudioPlayer';


interface ChatBubbleProps {
  message: ChatMessage;
}

// FIX: Refactor to a standard function component to fix framer-motion prop type errors.
export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === ChatRole.USER;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const timestamp = new Date(message.createdAt).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
  });

  return (
    <motion.div 
        className={`flex items-start gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gemini-blue to-gemini-violet flex items-center justify-center flex-shrink-0">
          <BotIcon className="w-5 h-5 text-white" />
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full overflow-hidden`}>
        <div className={`group relative max-w-xl xl:max-w-3xl px-5 py-3 rounded-2xl shadow-sm ${
            isUser 
            ? 'bg-dark-bubble-user text-white rounded-tr-none' 
            : 'bg-light-bubble-model dark:bg-dark-bubble-model text-light-text-primary dark:text-dark-text-primary rounded-tl-none'
          }`}
        >
           {/* Handle multiple attachments */}
           {message.attachments && message.attachments.length > 0 && (
                <AttachmentRenderer attachments={message.attachments} />
           )}
           {/* Fallback for legacy single attachment */}
           {/* @ts-ignore */}
           {message.attachment && <AttachmentRenderer attachments={[message.attachment]} />}

           {message.fireAiState ? (
                <FireAiProcessVisualizer state={message.fireAiState} />
           ) : message.audioOutput ? (
                <AudioPlayer audioOutput={message.audioOutput} />
           ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none text-light-text-primary dark:text-dark-text-primary break-words">
                    {message.content ? (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                            code: CodeBlock,
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                            a: ({node, ...props}) => <a className="text-gemini-blue hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-light-border dark:border-dark-border pl-4 italic my-2" {...props} />,
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    ) : (
                        !isUser && (!message.attachments || message.attachments.length === 0) && <span className="invisible">.</span>
                    )}
                </div>
           )}

          {!isUser && message.groundingChunks && <GroundingSources chunks={message.groundingChunks} />}

          {!isUser && message.generationTime && (
              <p className="text-xs text-right mt-2 text-light-text-secondary dark:text-dark-text-secondary opacity-70">
                  ایجاد شده در {message.generationTime.toFixed(2)} ثانیه
              </p>
          )}

          {!isUser && message.content && !message.fireAiState && !message.audioOutput && (
              <button 
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-1.5 bg-white/50 dark:bg-dark-bg/50 rounded-full text-light-text-secondary dark:text-dark-text-secondary opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="کپی کردن پیام"
              >
                {copied ? (
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <CopyIcon className="w-4 h-4" />
                )}
              </button>
          )}
        </div>
        <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1.5 px-2">
            {timestamp}
        </div>
      </div>


      {isUser && (
        <div className="w-8 h-8 rounded-full bg-light-bubble-model dark:bg-dark-bubble-model flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-5 h-5" />
        </div>
      )}
    </motion.div>
  );
};
