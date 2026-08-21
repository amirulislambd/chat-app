'use client';

import { useState, useEffect } from 'react';
import { Conversation, User } from '../types';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api';


type Tab = 'direct' | 'group';

interface NewChatModalProps {
  onClose: () => void;
  onChatCreated: (conversation: Conversation) => void;
  /** Pass the current conversation list so we can detect duplicates client-side (Priority 1) */
  existingConversations?: Conversation[];
}

export default function NewChatModal({ onClose, onChatCreated, existingConversations = [] }: NewChatModalProps) {
  const { token, user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('direct');

  // Search state
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Group state
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Search effect
  useEffect(() => {
    if (!debouncedQuery.trim() || !token) {
      setSearchResults([]);
      return;
    }

    let isMounted = true;
    const search = async () => {
      setIsSearching(true);
      setError(null);
      try {
        const results = await api.searchUsers(token, debouncedQuery);
        // Exclude current user from results
        if (isMounted) {
          setSearchResults(results.filter(u => u._id !== currentUser?._id));
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Search failed');
      } finally {
        if (isMounted) setIsSearching(false);
      }
    };

    search();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, token, currentUser?._id]);

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const handleStartDirectChat = async (userId: string) => {
    if (!token) return;

    // PRIORITY 1: Check if a direct conversation with this user already exists locally.
    // If so, navigate straight to it — don't call the API again.
    const existing = existingConversations.find(
      c =>
        c.type === 'direct' &&
        Array.isArray(c.participants) &&
        c.participants.some(p => p._id === userId)
    );
    if (existing) {
      onChatCreated(existing); // jump straight to the existing conversation
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const conv = await api.startConversation(token, userId);
      onChatCreated(conv);
    } catch (err: any) {
      setError(err.message || 'Failed to start conversation');
      setIsCreating(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!token) return;
    if (selectedUsers.size === 0) {
      setError('Select at least one user to add to the group');
      return;
    }
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const conv = await api.createGroup(token, groupName.trim(), Array.from(selectedUsers));
      onChatCreated(conv);
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Chat</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            ✕
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'direct' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            onClick={() => setActiveTab('direct')}
          >
            Direct Message
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'group' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            onClick={() => setActiveTab('group')}
          >
            New Group
          </button>
        </div>

        <div className="p-4 flex-shrink-0">
          {error && <div className="mb-3 text-sm text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/30 rounded">{error}</div>}

          {activeTab === 'group' && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Group Subject"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          <input
            type="text"
            placeholder="Search users by name or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 border-t border-gray-100 dark:border-gray-700">
          {isSearching ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">Searching...</div>
          ) : query && searchResults.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">No users found</div>
          ) : (
            <ul className="space-y-2">
              {searchResults.map(user => (
                <li key={user._id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                  onClick={() => activeTab === 'direct' ? handleStartDirectChat(user._id) : toggleUserSelection(user._id)}>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.phone}</div>
                  </div>
                  {activeTab === 'group' && (
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user._id)}
                      onChange={() => toggleUserSelection(user._id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {activeTab === 'group' && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleCreateGroup}
              disabled={isCreating || selectedUsers.size === 0 || !groupName.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              {isCreating ? 'Creating...' : `Create Group (${selectedUsers.size})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
