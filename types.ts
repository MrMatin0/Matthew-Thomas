
// FIX: Define types used throughout the application.
import { Part } from "@google/genai";

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export enum ChatRole {
  USER = 'user',
  MODEL = 'model',
}

export interface ChatAttachment {
  type: 'image' | 'audio' | 'pdf' | 'other';
  name: string;
  data: string; // Base64 encoded data URI
  mimeType: string;
}

export interface AudioOutput {
    data: string; // Base64 data URI
    mimeType: string;
}

export interface GroundingChunk {
    web: {
      uri: string;
      title: string;
    };
}

export interface FireAiState {
  phase: 'generating' | 'synthesizing';
  initialResponses: { id: number; content: string | null; status: 'pending' | 'complete' }[];
  progress: number;
}
  
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number; // timestamp
  attachment?: ChatAttachment | null;
  audioOutput?: AudioOutput | null;
  groundingChunks?: GroundingChunk[];
  generationTime?: number;
  fireAiState?: FireAiState;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  systemInstruction: string;
  model: Model;
}

export type Theme = 'light' | 'dark';

export const ALL_MODELS = [
  'gemini-flash-latest',
  'gemini-2.5-pro',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-preview-tts',
  'web-search',
  'gemini-3-pro-preview',
  'gemini-3-jailbreak',
] as const;

export type Model = typeof ALL_MODELS[number];

export const TTS_VOICES = [
    { id: 'Kore', name: 'Kore', description: 'صدایی زنانه، گرم و آرامش‌بخش.' },
    { id: 'Puck', name: 'Puck', description: 'صدایی مردانه، پرانرژی و دوستانه.' },
    { id: 'Charon', name: 'Charon', description: 'صدایی مردانه، عمیق و مقتدر.' },
    { id: 'Zephyr', name: 'Zephyr', description: 'صدایی زنانه، ملایم و واضح.' },
    { id: 'Fenrir', name: 'Fenrir', description: 'صدایی مردانه، خشن و حماسی.' },
] as const;

export type TtsVoice = typeof TTS_VOICES[number]['id'];

export type Content = {
    role: string;
    parts: Part[];
};