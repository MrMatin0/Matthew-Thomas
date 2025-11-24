import React from 'react';
import { ChatMessage } from '../../types';
import { PdfIcon } from '../icons/PdfIcon';
import { AudioIcon } from '../icons/AudioIcon';
import { AttachmentIcon } from '../icons/AttachmentIcon';

interface AttachmentRendererProps {
    attachment: NonNullable<ChatMessage['attachment']>;
}

// FIX: Refactor to a standard function component to avoid potential type issues with libraries like framer-motion.
export const AttachmentRenderer = ({ attachment }: AttachmentRendererProps) => {
    switch (attachment.type) {
        case 'image':
            return (
                <img 
                    src={attachment.data} 
                    alt="user attachment" 
                    className="rounded-lg mb-2 max-w-full h-auto border border-light-border dark:border-dark-border"
                    style={{maxWidth: '320px'}}
                />
            );
        case 'audio':
            return (
                <div className="mb-2 p-3 rounded-lg bg-light-sidebar dark:bg-dark-bg border border-light-border dark:border-dark-border">
                    <div className="flex items-center gap-3 mb-2">
                        <AudioIcon className="w-5 h-5 text-gemini-blue flex-shrink-0" />
                        <p className="text-sm font-medium truncate" title={attachment.name}>{attachment.name}</p>
                    </div>
                    <audio controls src={attachment.data} className="w-full h-10" />
                </div>
            );
        case 'pdf':
            return (
                 <div className="mb-2 p-3 rounded-lg bg-light-sidebar dark:bg-dark-bg border border-light-border dark:border-dark-border">
                     <a href={attachment.data} download={attachment.name} className="flex items-center gap-3 hover:bg-light-bubble-model dark:hover:bg-dark-bubble-model -m-2 p-2 rounded-lg transition-colors">
                        <PdfIcon className="w-6 h-6 text-red-400 flex-shrink-0" />
                        <div className="truncate">
                           <p className="text-sm font-medium truncate" title={attachment.name}>{attachment.name}</p>
                           <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">برای دانلود کلیک کنید</p>
                        </div>
                     </a>
                </div>
            );
        default:
             return (
                 <div className="mb-2 p-3 rounded-lg bg-light-sidebar dark:bg-dark-bg border border-light-border dark:border-dark-border">
                     <a href={attachment.data} download={attachment.name} className="flex items-center gap-3 hover:bg-light-bubble-model dark:hover:bg-dark-bubble-model -m-2 p-2 rounded-lg transition-colors">
                        <AttachmentIcon className="w-6 h-6 text-light-text-secondary dark:text-dark-text-secondary flex-shrink-0" />
                        <div className="truncate">
                           <p className="text-sm font-medium truncate" title={attachment.name}>{attachment.name}</p>
                           <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">برای دانلود کلیک کنید</p>
                        </div>
                     </a>
                </div>
            );
    }
}
