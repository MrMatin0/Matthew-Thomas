import React from 'react';

export const NexusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="M5.636 5.636l1.414 1.414" />
    <path d="M16.95 16.95l1.414 1.414" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M5.636 18.364l1.414-1.414" />
    <path d="M16.95 7.05l1.414-1.414" />
    <circle cx="12" cy="12" r="4" />
    <path d="M12 8a4 4 0 0 1 4 4" />
    <path d="M8 12a4 4 0 0 1 4-4" />
  </svg>
);