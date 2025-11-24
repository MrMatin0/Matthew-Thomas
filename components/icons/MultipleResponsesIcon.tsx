import React from 'react';

export const MultipleResponsesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className}
        aria-hidden="true"
    >
        <path d="M7 17h14V3H7v14zm2-10h10v2H9V7zm0 4h10v2H9v-2z" opacity=".3"/>
        <path d="M3 21h16v-2H3V5H1v14c0 1.1.9 2 2 2zM21 1H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 16H7V3h14v14zM9 7h10v2H9zm0 4h10v2H9z"/>
    </svg>
);
