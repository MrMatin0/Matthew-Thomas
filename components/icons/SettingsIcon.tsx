import React from 'react';

export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.61l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.49 1a8.3 8.3 0 0 0-1.64-.94l-.38-2.65A.5.5 0 0 0 14 2H10a.5.5 0 0 0-.5.43l-.38 2.65a8.3 8.3 0 0 0-1.64.94l-2.49-1a.5.5 0 0 0-.61.22l-1.92 3.32a.5.5 0 0 0 .12.61l2.03 1.58c-.04.3-.06.61-.06.94s.02.64.06.94l-2.03 1.58a.5.5 0 0 0-.12.61l1.92 3.32a.5.5 0 0 0 .61.22l2.49-1a8.3 8.3 0 0 0 1.64.94l.38 2.65a.5.5 0 0 0 .5.43h4a.5.5 0 0 0 .5-.43l.38-2.65a8.3 8.3 0 0 0 1.64-.94l2.49 1a.5.5 0 0 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.61l-2.03-1.58z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
