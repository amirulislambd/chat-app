'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const { token, user: currentUser } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // unreadCounts: conversationId -> count
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getConversations(token);

      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from server');
      }

      // Sort by most recently updated
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
        // Find the target conversation
        const idx = prev.findIndex(c => c._id === convId);

        let updated: Conversation;
        if (idx !== -1) {
          // Update lastMessage and updatedAt
          updated = {
            ...prev[idx],
            lastMessage: { text: msg.text, createdAt: msg.createdAt },
            updatedAt: msg.createdAt,
          };
          // Remove from old position, put at top
          const rest = prev.filter((_, i) => i !== idx);
          return [updated, ...rest];
        }
        // If conversation not in list (new), we can't fully reconstruct it yet
        // Just refetch to be safe — this is a rare edge case
        return prev;
      });

      // Increment unread count if this conversation is NOT the currently selected one
      // and the message is not sent by me
      if (convId !== selectedConversationId && msg.sender !== currentUser._id) {
        setUnreadCounts(prev => ({
          ...prev,
          [convId]: (prev[convId] || 0) + 1,
        }));
      }
    };

    socket.on('message:new', handleNewMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [selectedConversationId, currentUser]);

  // Clear unread count when user opens a conversation
  const handleSelectConversation = (id: string) => {
    setUnreadCounts(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    onSelectConversation(id);
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.type === 'group') {
      return conv.name || 'Unnamed Group';
    }
    if (conv.participant) {
      return conv.participant.name || 'Unknown User';
    }
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

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-full md:w-80 flex-shrink-0 ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Chats</h2>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 p-2 rounded-full transition-colors"
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
          // Skeleton loading state
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="p-6 text-center">
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchConversations}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded"
            >
              Try Again
            </button>
          </div>
        ) : conversations.length === 0 ? (
          // Empty state
          <div className="p-8 text-center flex flex-col items-center justify-center h-full">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-full p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No chats yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Get started by messaging a friend or creating a group.</p>
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Start a Conversation
            </button>
          </div>
        ) : (
          // List state
          <ul>
            {conversations.map(conv => {
              const unread = unreadCounts[conv._id] || 0;
              const isSelected = selectedConversationId === conv._id;
              return (
                <li
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv._id)}
                  className={`flex items-center p-3 cursor-pointer transition-colors border-l-4 hover:bg-gray-50 dark:hover:bg-gray-700
                    ${isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-l-blue-600 dark:border-l-blue-400'
                      : unread > 0
                        ? 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10'
                        : 'border-l-transparent'
                    }
                  `}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {getConversationName(conv).charAt(0).toUpperCase()}
                    </div>
                    {/* Unread badge on avatar */}
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className={`font-semibold truncate ${unread > 0 ? 'text-gray-900 dark:text-gray-50' : 'text-gray-800 dark:text-gray-100'}`}>
                        {getConversationName(conv)}
                      </h3>
                      <span className={`text-xs flex-shrink-0 ml-2 ${unread > 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                        {conv.lastMessage?.createdAt
                          ? formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })
                          : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm truncate ${unread > 0 ? 'font-semibold text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                        {conv.lastMessage?.text || <span className="italic font-normal text-gray-400 dark:text-gray-500">No messages yet</span>}
                      </p>
                    </div>
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
