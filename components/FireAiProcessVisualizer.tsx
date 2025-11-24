import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FireAiState } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { FireIcon } from './icons/FireIcon';
import { BotIcon } from './icons/BotIcon';

interface FireAiProcessVisualizerProps {
    state: FireAiState;
}

interface GeneratingPhaseProps {
    state: FireAiState;
}

// FIX: Refactor to a standard function component to fix framer-motion prop type errors.
const GeneratingPhase = ({ state }: GeneratingPhaseProps) => {
    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <FireIcon className="w-5 h-5 text-orange-400 animate-flicker" />
                <h3 className="font-semibold text-base">FireAI در حال اجرا...</h3>
            </div>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">
                مرحله ۱: تولید پاسخ‌های اولیه
            </p>
            <div className="w-full bg-light-bg dark:bg-dark-bg rounded-full h-2.5 mb-3 border border-light-border dark:border-dark-border">
                <motion.div
                    className="bg-gradient-to-r from-orange-400 to-red-500 h-full rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${(state.progress / 15) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
            </div>
            <p className="text-xs text-center text-light-text-secondary dark:text-dark-text-secondary mb-3">
                ({state.progress}/{state.initialResponses.length}) پاسخ دریافت شد
            </p>

            <div className="grid grid-cols-5 gap-2">
                {state.initialResponses.map(response => (
                    <motion.div
                        key={response.id}
                        className={`w-full aspect-square rounded-md flex items-center justify-center transition-colors ${
                            response.status === 'complete' ? 'bg-green-500/20' : 'bg-light-bg dark:bg-dark-bg'
                        }`}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: response.id * 0.02 }}
                    >
                        <AnimatePresence>
                            {response.status === 'complete' && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    <CheckIcon className="w-5 h-5 text-green-500" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};


// FIX: Refactor to a standard function component to fix framer-motion prop type errors.
const SynthesizingPhase = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center justify-center text-center p-4"
        >
             <div className="relative w-16 h-16 mb-4">
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute inset-0 border-2 border-gemini-blue rounded-full"
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.4,
                            ease: 'easeInOut',
                        }}
                    />
                ))}
                <BotIcon className="w-8 h-8 text-gemini-blue absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>

            <h3 className="font-semibold text-base mb-1">در حال تحلیل و ادغام</h3>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                مرحله ۲: بهترین ایده‌ها در حال ترکیب برای ایجاد یک پاسخ برتر هستند.
            </p>
        </motion.div>
    );
}

// FIX: Refactor to a standard function component to fix framer-motion prop type errors.
export const FireAiProcessVisualizer = ({ state }: FireAiProcessVisualizerProps) => {
    return (
        <div className="min-w-[300px]">
            <AnimatePresence mode="wait">
                <motion.div
                     key={state.phase}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     transition={{ duration: 0.3 }}
                >
                    {state.phase === 'generating' && <GeneratingPhase state={state} />}
                    {state.phase === 'synthesizing' && <SynthesizingPhase />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
