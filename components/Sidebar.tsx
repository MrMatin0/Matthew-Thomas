import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChatSession } from '../types';
import { NewChatIcon } from './icons/NewChatIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { CloseIcon } from './icons/CloseIcon';
import { BotIcon } from './icons/BotIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { SessionItem } from './SessionItem';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onNewChat: () => void;
  onSettingsOpen: () => void;
  isMobileDrawerOpen: boolean;
  onCloseMobileDrawer: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

// FIX: Refactor to a standard function component to fix framer-motion prop type errors.
export const Sidebar = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onNewChat,
  onSettingsOpen,
  isMobileDrawerOpen,
  onCloseMobileDrawer,
  theme,
  onToggleTheme,
}: SidebarProps) => {
  const sidebarContent = (
    <div className="flex flex-col h-full bg-light-sidebar dark:bg-dark-sidebar text-light-text-primary dark:text-dark-text-primary">
      <div className="flex-shrink-0 p-4 border-b border-light-border dark:border-dark-border">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-light-bubble-model dark:hover:bg-dark-bubble-model transition-colors"
            aria-label="New chat"
          >
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gradient-to-br from-gemini-blue to-gemini-violet rounded-md">
                    <BotIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold">گفت‌وگوی جدید</span>
            </div>
            <NewChatIcon className="w-5 h-5" />
          </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              onSelect={() => onSelectSession(session.id)}
              onDelete={() => onDeleteSession(session.id)}
              onRename={(newTitle) => onRenameSession(session.id, newTitle)}
            />
          ))}
        </ul>
      </nav>

      <div className="flex-shrink-0 p-4 border-t border-light-border dark:border-dark-border space-y-2">
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center gap-3 p-3 rounded-lg text-sm hover:bg-light-bubble-model dark:hover:bg-dark-bubble-model transition-colors"
        >
          {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          {theme === 'light' ? 'حالت تیره' : 'حالت روشن'}
        </button>
        <button
          onClick={onSettingsOpen}
          className="w-full flex items-center gap-3 p-3 rounded-lg text-sm hover:bg-light-bubble-model dark:hover:bg-dark-bubble-model transition-colors"
        >
          <SettingsIcon className="w-5 h-5" />
          تنظیمات
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 border-l border-light-border dark:border-dark-border">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={onCloseMobileDrawer}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full z-40 w-72 flex flex-col shadow-lg lg:hidden"
              role="dialog"
              aria-modal="true"
            >
              <button 
                onClick={onCloseMobileDrawer}
                className="absolute top-3 left-3 p-2 z-50 text-light-text-secondary dark:text-dark-text-secondary"
                aria-label="Close menu"
              >
                <CloseIcon className="w-6 h-6"/>
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};