import React, { useState } from 'react';
import { CopyIcon } from '../icons/CopyIcon';

// FIX: Refactor to a standard function component to avoid potential type issues with libraries like framer-motion.
export const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const [copied, setCopied] = useState(false);
  const textToCopy = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return !inline ? (
    <div className="relative my-2 bg-light-bg dark:bg-dark-sidebar rounded-lg overflow-hidden border border-light-border dark:border-dark-border">
      <div className="flex justify-between items-center text-xs text-light-text-secondary dark:text-dark-text-secondary bg-light-sidebar dark:bg-dark-bg px-4 py-2">
        <span>{match ? match[1] : 'code'}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors">
          <CopyIcon className="w-4 h-4" />
          {copied ? 'کپی شد!' : 'کپی'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  ) : (
    <code className="bg-light-bubble-model dark:bg-dark-bubble-model text-gemini-blue px-1 py-0.5 rounded" {...props}>
      {children}
    </code>
  );
};
