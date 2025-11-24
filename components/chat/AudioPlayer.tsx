import React, { useState, useRef, useEffect } from 'react';
import { AudioOutput } from '../../types';
import { decode, decodeAudioData } from '../../utils/file-helpers';
import { PlayIcon } from '../icons/PlayIcon';
import { PauseIcon } from '../icons/PauseIcon';

export const AudioPlayer = ({ audioOutput }: { audioOutput: AudioOutput }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    const handlePlayPause = async () => {
        if (isPlaying) {
            if (sourceNodeRef.current) {
                sourceNodeRef.current.stop();
            }
            return; 
        }

        try {
            // FIX: Cast window to any to support webkitAudioContext for older browsers without TypeScript errors.
            const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = context;

            const base64Audio = audioOutput.data.split(',')[1];
            const decodedBytes = decode(base64Audio);
            const audioBuffer = await decodeAudioData(decodedBytes, context, 24000, 1);
            
            const source = context.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(context.destination);
            
            source.onended = () => {
                setIsPlaying(false);
                sourceNodeRef.current = null;
                if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                    audioContextRef.current.close();
                    audioContextRef.current = null;
                }
            };
            
            source.start();
            sourceNodeRef.current = source;
            setIsPlaying(true);
        } catch (error) {
            console.error("Failed to play audio:", error);
            setIsPlaying(false);
        }
    };
    
    useEffect(() => {
        return () => {
            if (sourceNodeRef.current) {
                sourceNodeRef.current.stop();
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, []);

    return (
        <div className="flex items-center gap-4 p-2 rounded-lg bg-light-sidebar dark:bg-dark-bg border border-light-border dark:border-dark-border min-w-[200px]">
            <button 
                onClick={handlePlayPause} 
                className={`p-3 rounded-full transition-colors ${isPlaying ? 'bg-red-500/80 hover:bg-red-500' : 'bg-dark-bubble-user hover:opacity-90'} text-white`}
                aria-label={isPlaying ? "توقف" : "پخش"}
            >
                {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
            </button>
            <div className="flex-1 text-sm font-medium text-light-text-primary dark:text-dark-text-primary">پاسخ صوتی</div>
        </div>
    );
};
