import React from 'react';
import { motion } from 'framer-motion';
import { useClickOutside } from '../hooks/useClickOutside';

interface CandidateSelectorProps {
    count: number;
    onChange: (count: number) => void;
    onClose: () => void;
}

// FIX: Refactor to a standard function component to fix framer-motion prop type errors.
export const CandidateSelector = ({ count, onChange, onClose }: CandidateSelectorProps) => {
    const popoverRef = useClickOutside<HTMLDivElement>(onClose);

    return (
        <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-full mb-3 right-0 w-64 bg-light-sidebar dark:bg-dark-sidebar border border-light-border dark:border-dark-border rounded-xl shadow-xl z-10 p-4"
        >
            <label htmlFor="candidate-slider" className="block text-sm font-medium mb-2 text-light-text-primary dark:text-dark-text-primary">
                تعداد پاسخ‌ها: <span className="font-bold text-gemini-blue">{count}</span>
            </label>
            <input
                id="candidate-slider"
                type="range"
                min="1"
                max="20" // Gemini API may have lower limits
                value={count}
                onChange={(e) => onChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-light-bubble-model dark:bg-dark-bubble-model rounded-lg appearance-none cursor-pointer accent-gemini-blue"
            />
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-3">
                {count > 1 
                    ? "تولید چندین پاسخ ممکن است کندتر باشد و از منابع بیشتری استفاده کند."
                    : "حداکثر ۲۰ پاسخ همزمان پشتیبانی می‌شود."
                }
            </p>
        </motion.div>
    );
};
