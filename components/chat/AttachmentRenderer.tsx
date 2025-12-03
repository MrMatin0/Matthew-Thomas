
import React from 'react';
import { ChatMessage, ChatAttachment } from '../../types';
import { PdfIcon } from '../icons/PdfIcon';
import { AudioIcon } from '../icons/AudioIcon';
import { AttachmentIcon } from '../icons/AttachmentIcon';
import { DownloadIcon } from '../icons/DownloadIcon';

interface AttachmentRendererProps {
    attachments: ChatAttachment[];
}

const ImageAttachment = ({ attachment }: { attachment: ChatAttachment }) => (
    <div className="relative group w-full max-w-sm mx-auto sm:max-w-md my-2">
        <img 
            src={attachment.data} 
            alt={attachment.name || "attachment"} 
            className="w-full h-auto rounded-xl object-cover shadow-sm border border-light-border dark:border-dark-border"
            loading="lazy"
        />
        <a 
            href={attachment.data} 
            download={attachment.name || `image-${Date.now()}.png`}
            className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all duration-200 shadow-md"
            title="دانلود تصویر"
        >
            <DownloadIcon className="w-5 h-5" />
        </a>
    </div>
);

const FileAttachment = ({ attachment, icon: Icon, colorClass }: { attachment: ChatAttachment, icon: React.FC<{ className?: string }>, colorClass: string }) => (
    <div className="mb-2 p-3 rounded-lg bg-light-sidebar dark:bg-dark-bg border border-light-border dark:border-dark-border flex items-center gap-3 overflow-hidden max-w-full">
        <div className="flex-shrink-0">
             <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate dir-ltr text-left" title={attachment.name}>{attachment.name}</p>
            <a 
                href={attachment.data} 
                download={attachment.name} 
                className="text-xs text-light-text-secondary dark:text-dark-text-secondary hover:text-gemini-blue hover:underline flex items-center gap-1 mt-0.5"
            >
                <DownloadIcon className="w-3 h-3" />
                دانلود فایل
            </a>
        </div>
    </div>
);

const AudioAttachment = ({ attachment }: { attachment: ChatAttachment }) => (
    <div className="mb-2 p-3 rounded-lg bg-light-sidebar dark:bg-dark-bg border border-light-border dark:border-dark-border w-full overflow-hidden">
        <div className="flex items-center gap-3 mb-2 overflow-hidden">
            <AudioIcon className="w-5 h-5 text-gemini-blue flex-shrink-0" />
            <p className="text-sm font-medium truncate dir-ltr text-left" title={attachment.name}>{attachment.name}</p>
        </div>
        <audio controls src={attachment.data} className="w-full h-8" />
    </div>
);

export const AttachmentRenderer = ({ attachments }: AttachmentRendererProps) => {
    if (!attachments || attachments.length === 0) return null;

    return (
        <div className="flex flex-col gap-2 mb-2 w-full max-w-full overflow-hidden">
            {/* Grid for images if there are multiple */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.filter(a => a.type === 'image').map((attachment, index) => (
                     <div key={`img-${index}`} className={attachments.length === 1 ? 'col-span-1 sm:col-span-2' : ''}>
                        <ImageAttachment attachment={attachment} />
                     </div>
                ))}
            </div>

            {/* List for other files */}
            <div className="flex flex-col gap-2">
                {attachments.filter(a => a.type !== 'image').map((attachment, index) => {
                    switch (attachment.type) {
                        case 'audio':
                            return <AudioAttachment key={`file-${index}`} attachment={attachment} />;
                        case 'pdf':
                            return <FileAttachment key={`file-${index}`} attachment={attachment} icon={PdfIcon} colorClass="text-red-400" />;
                        default:
                            return <FileAttachment key={`file-${index}`} attachment={attachment} icon={AttachmentIcon} colorClass="text-light-text-secondary dark:text-dark-text-secondary" />;
                    }
                })}
            </div>
        </div>
    );
}
