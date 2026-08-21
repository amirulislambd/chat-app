'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';

import NewChatModal from './NewChatModal';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../lib/auth-context';
import { Conversation } from '../types';
import { api } from '../lib/api';

interface ConversationListProps {
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

export default function ConversationList({ selectedConversationId, onSelectConversation }: ConversationListProps) {
  const { token, user: currentUser } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const responseData = await api.getConversations(token);
      // Ensure data is an array in case the API returns an object (e.g., { data: [...] } or { conversations: [...] })
      const data = Array.isArray(responseData) 
        ? responseData 
        : (responseData as any).data || (responseData as any).conversations || [];
        
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

  const getConversationName = (conv: Conversation) => {
    if (conv.type === 'group') {
      return conv.name || 'Unnamed Group';
    }
    // For direct chats, find the other participant
    // Guard: participants may be undefined if the API omits it
    const participants = Array.isArray(conv.participants) ? conv.participants : [];
    const otherParticipant = participants.find(p => p._id !== currentUser?._id);
    return otherParticipant?.name || 'Unknown User';
  };

  const handleChatCreated = (conv: Conversation) => {
    setIsNewChatModalOpen(false);
    // Add to top of list if not already there
    setConversations(prev => {
      const exists = prev.find(c => c.id === conv.id);
      if (exists) return prev;
      return [conv, ...prev];
    });
    onSelectConversation(conv.id);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-full md:w-80 flex-shrink-0">
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
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {conversations.map(conv => (
              <li
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`p-3 cursor-pointer transition-colors flex items-center ${
                  selectedConversationId === conv.id
                    ? 'bg-blue-50 dark:bg-blue-900/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-lg">
                  {getConversationName(conv).charAt(0).toUpperCase()}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {getConversationName(conv)}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                      {conv.lastMessage?.createdAt ? formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true }) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {conv.lastMessage?.text || <span className="italic">No messages yet</span>}
                  </p>
                </div>
              </li>
            ))}
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
