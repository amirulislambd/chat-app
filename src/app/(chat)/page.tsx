'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConversationList from '@/src/components/ConversationList';
import { useAuth } from '@/src/lib/auth-context';


export default function ChatPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Route guard: if no token exists, redirect to login
  useEffect(() => {
    if (token === null) {
      // Null means we checked and it's not there (initial state might be null or undefined depending on auth logic, but our AuthProvider sets null if no token)
      // Actually, wait: our useAuth might still be loading initially if we don't have a loading state.
      // But if token is definitively null after mount and localstorage check, redirect.
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        router.replace('/login');
      }
    }
  }, [token, router]);

  // Don't render until we know auth state
  if (!user || !token) {
    return <div className="h-screen bg-white" />; // Or a generic loading spinner
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar: Conversation List */}
      <ConversationList
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
      />

      {/* Main Content: Chat Panel Placeholder */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-800">
        {selectedConversationId ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Chat Panel Placeholder (Conversation ID: {selectedConversationId})
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Select a conversation to start chatting
          </div>
        )}
      </main>
    </div>
  );
}
