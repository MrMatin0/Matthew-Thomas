import React from 'react';
import { ChatMessage } from '../../types';
import { LinkIcon } from '../icons/LinkIcon';

interface GroundingSourcesProps {
    chunks: NonNullable<ChatMessage['groundingChunks']>;
}

// FIX: Refactor to a standard function component to avoid potential type issues with libraries like framer-motion.
export const GroundingSources = ({ chunks }: GroundingSourcesProps) => {
    if (!chunks || chunks.length === 0) return null;

    return (
        <div className="mt-4 pt-3 border-t border-light-border/50 dark:border-dark-border/50">
            <h4 className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-2">منابع</h4>
            <ol className="list-decimal list-inside space-y-1">
                {chunks.map((chunk, index) => (
                    <li key={index} className="text-xs">
                        <a 
                            href={chunk.web.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-gemini-blue/90 hover:text-gemini-blue hover:underline truncate"
                            title={chunk.web.title}
                        >
                           <LinkIcon className="w-3 h-3 flex-shrink-0" />
                           <span className="truncate">{chunk.web.title || new URL(chunk.web.uri).hostname}</span>
                        </a>
                    </li>
                ))}
            </ol>
        </div>
    )
}
