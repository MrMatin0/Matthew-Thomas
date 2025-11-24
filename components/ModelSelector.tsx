
// FIX: Implement the ModelSelector component.
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Model, ALL_MODELS } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { FlashIcon } from './icons/FlashIcon';
import { ProIcon } from './icons/ProIcon';
import { LiteIcon } from './icons/LiteIcon';
import { ImageIcon } from './icons/ImageIcon';
import { SearchIcon } from './icons/SearchIcon';
import { TtsIcon } from './icons/TtsIcon';
import { FireIcon } from './icons/FireIcon';
import { useClickOutside } from '../hooks/useClickOutside';

interface ModelSelectorProps {
  selectedModel: Model;
  onSelectModel: (model: Model) => void;
}

const modelDetails: Record<Model, { name: string; icon: React.FC<any> }> = {
  'gemini-2.5-pro': { name: 'Gemini Pro', icon: ProIcon },
  'gemini-flash-latest': { name: 'Gemini Flash', icon: FlashIcon },
  'gemini-flash-lite-latest': { name: 'Gemini Lite', icon: LiteIcon },
  'gemini-2.5-flash-image': { name: 'Gemini Image', icon: ImageIcon },
  'gemini-2.5-flash-preview-tts': { name: 'Gemini TTS', icon: TtsIcon },
  'web-search': { name: 'Search Web', icon: SearchIcon },
  'gemini-3-pro-preview': { name: 'Gemini 3.0 Preview', icon: ProIcon },
  'gemini-3-jailbreak': { name: 'Gemini 3.0 (JailBreak)', icon: FireIcon },
};

// FIX: Refactor to a standard function component to fix framer-motion prop type errors.
export const ModelSelector = ({ selectedModel, onSelectModel }: ModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false));
  const selectedModelInfo = modelDetails[selectedModel];

  const handleSelect = (model: Model) => {
    onSelectModel(model);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-light-sidebar dark:bg-dark-sidebar hover:bg-light-bubble-model dark:hover:bg-dark-bubble-model border border-light-border dark:border-dark-border transition-colors"
      >
        <selectedModelInfo.icon className="w-5 h-5 text-gemini-blue" />
        <span className="text-light-text-primary dark:text-dark-text-primary">{selectedModelInfo.name}</span>
        <ChevronDownIcon className={`w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full right-0 mt-2 w-48 bg-light-sidebar dark:bg-dark-sidebar border border-light-border dark:border-dark-border rounded-lg shadow-xl z-10 overflow-hidden"
          >
            <ul className="py-1">
              {ALL_MODELS.map((modelId) => {
                const modelInfo = modelDetails[modelId];
                if (!modelInfo) return null;
                return (
                  <li key={modelId}>
                    <button
                      onClick={() => handleSelect(modelId)}
                      className="w-full text-right flex items-center gap-3 px-3 py-2 text-sm hover:bg-light-bubble-model dark:hover:bg-dark-bubble-model"
                    >
                      <modelInfo.icon className="w-5 h-5 text-gemini-blue" />
                      <span className="text-light-text-primary dark:text-dark-text-primary">{modelInfo.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
