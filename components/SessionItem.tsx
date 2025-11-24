import React, { useState, useRef, useEffect } from 'react';
import { ChatSession } from '../types';
import { EditIcon } from './icons/EditIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { CheckIcon } from './icons/CheckIcon';

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
}

// FIX: Refactor to a standard function component to avoid potential type issues with libraries like framer-motion.
export const SessionItem: React.FC<SessionItemProps> = ({ session, isActive, onSelect, onDelete, onRename }) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [title, setTitle] = useState(session.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(session.title);
  }, [session.title]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);
  
  const handleRename = () => {
    if (title.trim() && title.trim() !== session.title) {
      onRename(title.trim());
    } else {
      setTitle(session.title);
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setTitle(session.title);
      setIsRenaming(false);
    }
  };

  return (
    <li
      className={`group relative flex items-center rounded-lg cursor-pointer transition-colors duration-200 ${
        isActive
          ? 'bg-dark-bubble-user text-white'
          : 'hover:bg-light-bubble-model dark:hover:bg-dark-bubble-model'
      }`}
    >
      {isRenaming ? (
        <div className="flex items-center w-full p-2">
            <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-light-bubble-model dark:bg-dark-bubble-model text-sm rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-gemini-blue"
            />
            <button onClick={handleRename} className="p-1.5 hover:text-light-text-primary dark:hover:text-dark-text-primary ml-1">
                <CheckIcon className="w-4 h-4" />
            </button>
        </div>
      ) : (
        <>
          <div onClick={onSelect} className="flex-1 p-3 text-sm truncate">
            {session.title}
          </div>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-light-sidebar/80 dark:bg-dark-sidebar/80 rounded-md">
            <button
              onClick={() => setIsRenaming(true)}
              className="p-1.5 hover:text-light-text-primary dark:hover:text-dark-text-primary"
              aria-label="Rename chat"
            >
              <EditIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 hover:text-red-500"
              aria-label="Delete chat"
            >
              <DeleteIcon className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </li>
  );
};
