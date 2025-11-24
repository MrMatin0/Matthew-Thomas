// FIX: Implement the FlashIcon component.
import React from 'react';

export const FlashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
    >
        <path d="M7 2v11h3v9l7-12h-4l4-8H7z" />
    </svg>
);
