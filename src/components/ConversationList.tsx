'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';

import NewChatModal from './NewChatModal';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../lib/auth-context';
import { Conversation, Message } from '../types';
import { api } from '../lib/api';
import { socket } from '../lib/socket';

interface ConversationListProps {
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  className?: string;
}

export default function ConversationList({ selectedConversationId, onSelectConversation, className = '' }: ConversationListProps) {
  const { token, user: currentUser, logout } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getConversations(token);
      if (!Array.isArray(data)) throw new Error('Invalid response format from server');
      const sorted = [...data].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setConversations(sorted);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Real-time: listen for new messages and update sidebar instantly
  useEffect(() => {
    if (!currentUser) return;

    const handleNewMessage = (msg: Message) => {
      const convId = msg.conversation;
      if (!convId) return;

      setConversations(prev => {
        const idx = prev.findIndex(c => c._id === convId);
        if (idx !== -1) {
          const updated: Conversation = {
            ...prev[idx],
            lastMessage: { text: msg.text, createdAt: msg.createdAt },
            updatedAt: msg.createdAt,
          };
          const rest = prev.filter((_, i) => i !== idx);
          return [updated, ...rest];
        }
        return prev;
      });

      if (convId !== selectedConversationId && msg.sender !== currentUser._id) {
        setUnreadCounts(prev => ({ ...prev, [convId]: (prev[convId] || 0) + 1 }));
      }
    };

    socket.on('message:new', handleNewMessage);
    return () => { socket.off('message:new', handleNewMessage); };
  }, [selectedConversationId, currentUser]);

  const handleSelectConversation = (id: string) => {
    setUnreadCounts(prev => { const next = { ...prev }; delete next[id]; return next; });
    onSelectConversation(id);
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.type === 'group') return conv.name || 'Unnamed Group';
    if (conv.participant) return conv.participant.name || 'Unknown User';
    return 'Unknown User';
  };

  const handleChatCreated = (conv: Conversation) => {
    setIsNewChatModalOpen(false);
    setConversations(prev => {
      const exists = prev.find(c => c._id === conv._id);
      if (exists) return prev;
      return [conv, ...prev];
    });
    onSelectConversation(conv._id);
  };

  const initials = currentUser?.name?.charAt(0).toUpperCase() || '?';

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 w-full md:w-72 flex-shrink-0 ${className}`}>
      {/* Header — WhatsApp style */}
      <div className="h-14 px-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        {/* User Avatar with popover */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(v => !v)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow hover:ring-2 hover:ring-green-400 transition-all"
            title="Your profile"
          >
            {initials}
          </button>

          {/* Profile Popover */}
          {showProfileMenu && (
            <div className="absolute top-11 left-0 z-50 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-4 bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-700 dark:to-gray-700 border-b border-gray-100 dark:border-gray-600">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-2 shadow-md">
                  {initials}
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white text-center truncate">{currentUser?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center truncate mt-0.5">{currentUser?.phone}</p>
              </div>
              <button
                onClick={() => { setShowProfileMenu(false); logout?.(); }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log out
              </button>
            </div>
          )}
        </div>

        <span className="font-bold text-base text-gray-800 dark:text-gray-100">Chats</span>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="New Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <button onClick={fetchConversations} className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded">
              Try Again
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-full p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">No chats yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Start a conversation with someone!</p>
            <button onClick={() => setIsNewChatModalOpen(true)} className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-full text-sm transition-colors">
              Start a Chat
            </button>
          </div>
        ) : (
          <ul>
            {conversations.map(conv => {
              const unread = unreadCounts[conv._id] || 0;
              const isSelected = selectedConversationId === conv._id;
              const name = getConversationName(conv);
              return (
                <li
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv._id)}
                  className={`flex items-center px-3 py-3 cursor-pointer transition-colors
                    ${isSelected
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="ml-3 flex-1 min-w-0 border-b border-gray-100 dark:border-gray-700/50 pb-3">
                    <div className="flex justify-between items-baseline">
                      <h3 className={`text-sm font-semibold truncate ${unread > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                        {name}
                      </h3>
                      <span className={`text-[11px] flex-shrink-0 ml-2 ${unread > 0 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                        {conv.lastMessage?.createdAt
                          ? formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })
                          : ''}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'font-semibold text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                      {conv.lastMessage?.text || <span className="italic font-normal">No messages yet</span>}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isNewChatModalOpen && (
        <NewChatModal
          onClose={() => setIsNewChatModalOpen(false)}
          onChatCreated={handleChatCreated}
          existingConversations={conversations}
        />
      )}
    </div>
  );
}
