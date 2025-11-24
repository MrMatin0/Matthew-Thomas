import React, { useState, useEffect } from 'react';
import { BotIcon } from './icons/BotIcon';

interface LoadingIndicatorProps {
  startTime: number | null;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ startTime }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    
    setElapsed(0); // Reset on new generation
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null;

  const totalSeconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return (
    <div className="flex items-start gap-4 justify-end animate-fade-in">
      <div className="bg-light-bubble-model dark:bg-dark-bubble-model px-5 py-3 rounded-2xl rounded-br-none text-light-text-secondary dark:text-dark-text-secondary flex items-center gap-3 shadow-sm">
        <div className="w-2 h-2 bg-gemini-blue rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-gemini-blue rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
        <div className="w-2 h-2 bg-gemini-blue rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
      </div>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gemini-blue to-gemini-violet flex items-center justify-center flex-shrink-0">
        <BotIcon className="w-5 h-5 text-white" />
      </div>
    </div>
  );
};
