import { useState, useEffect, useCallback } from 'react';
import { Theme } from '../types';

export const useTheme = (): [Theme, () => void] => {
    const [theme, setTheme] = useState<Theme>('dark');

    useEffect(() => {
        try {
            const savedTheme = localStorage.getItem('theme') as Theme;
            if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
                setTheme(savedTheme);
            } else {
                const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                setTheme(prefersDark ? 'dark' : 'light');
            }
        } catch (error) {
            console.error("Failed to load theme from localStorage:", error);
            setTheme('dark');
        }
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        try {
            localStorage.setItem('theme', theme);
        } catch (error) {
            console.error("Failed to save theme to localStorage:", error);
        }
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    }, []);

    return [theme, toggleTheme];
};
