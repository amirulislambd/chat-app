'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/lib/auth-context';
import ConversationList from '@/src/components/ConversationList';
import MessageBubble from '@/src/components/MessageBubble';
import MessageInput from '@/src/components/MessageInput';
import TypingIndicator from '@/src/components/TypingIndicator';
import OfflineBanner from '@/src/components/OfflineBanner';
import { api } from '@/src/lib/api';
import { socket, connectSocket, disconnectSocket } from '@/src/lib/socket';
import { Message, Conversation, SeenPayload } from '@/src/types';

export default function ChatPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // PRIORITY 3: Queue for offline messages
  // Decided to keep in memory (state) for now. If app is closed, queue is dropped. 
  // Rationale: localStorage is tricky for multiple tabs and ensuring sync with server sequence.
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Helper to auto-scroll
  const scrollToBottom = (behavior: 'auto' | 'smooth' = 'auto') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Route guard & Socket connect
  useEffect(() => {
    if (token === null) {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        router.replace('/login');
      }
    } else if (token) {
      connectSocket(token);
    }
    return () => {
      // Disconnect socket on unmount
      disconnectSocket();
    };
  }, [token, router]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!token || !selectedConversationId) return;

    let isMounted = true;
    const fetchMsgs = async () => {
      setLoadingMessages(true);
      try {
        const data = await api.getMessages(token, selectedConversationId);
        if (isMounted) {
          // Priority 4: assume fetched messages are already 'seen' or 'delivered' by definition of being in DB
          setMessages(data.map(m => ({ ...m, status: 'seen' })));
          // Wait for render then scroll
          setTimeout(() => scrollToBottom('auto'), 100);
        }
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    };
    fetchMsgs();

    return () => { isMounted = false; };
  }, [token, selectedConversationId]);

  // Handle incoming real-time messages & seen receipts
  useEffect(() => {
    if (!selectedConversationId || !user) return;

    const handleNewMessage = (msg: Message) => {
      if (msg.conversationId === selectedConversationId) {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, { ...msg, status: 'delivered' }];
        });

        // Auto-scroll logic: only scroll if already near bottom, else show "new message" pill (implement pill later)
        const container = scrollContainerRef.current;
        if (container) {
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
          if (isNearBottom || msg.senderId === user._id) {
            setTimeout(() => scrollToBottom('smooth'), 50);
          }
        }

        // PRIORITY 4: Emit seen immediately if we are viewing this chat
        socket.emit('message:seen', {
          conversationId: selectedConversationId,
          lastSeenMessageId: msg.id,
          userId: user._id
        } as SeenPayload);
      }
    };

    const handleMessageSeen = (payload: SeenPayload) => {
      if (payload.conversationId === selectedConversationId && payload.userId !== user._id) {
        // Mark all my messages in this convo up to lastSeenMessageId as seen
        setMessages(prev => prev.map(m => 
          m.senderId === user._id ? { ...m, status: 'seen' } : m
        ));
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:seen', handleMessageSeen);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:seen', handleMessageSeen);
    };
  }, [selectedConversationId, user]);

  if (!user || !token) {
    return <div className="h-screen bg-white dark:bg-gray-900" />;
  }

  // Combine real and pending messages for display
  const allMessages = [...messages, ...pendingMessages.filter(p => p.conversationId === selectedConversationId)];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <OfflineBanner />
      
      {/* Sidebar: Conversation List */}
      <ConversationList
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
      />

      {/* Main Content: Chat Panel */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-800 relative">
        {selectedConversationId ? (
          <>
            {/* Header placeholder (would normally show conversation name) */}
            <div className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 bg-white dark:bg-gray-800 shadow-sm z-10 flex-shrink-0">
               <h3 className="font-medium text-gray-900 dark:text-gray-100">Chat</h3>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] dark:bg-gray-900"
            >
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : allMessages.length === 0 ? (
                <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">
                  No messages yet. Send a message to start the conversation!
                </div>
              ) : (
                <div className="flex flex-col">
                  {allMessages.map(msg => (
                    <MessageBubble 
                      key={msg.id || msg.localId} 
                      message={msg} 
                      isOwn={msg.senderId === user._id} 
                    />
                  ))}
                  <div ref={messagesEndRef} className="h-1" />
                </div>
              )}
            </div>

            {/* Priority 2: Typing Indicator */}
            <TypingIndicator 
              conversationId={selectedConversationId} 
              currentUserId={user._id} 
            />

            {/* Input Area */}
            <MessageInput 
              conversationId={selectedConversationId}
              token={token}
              currentUserId={user._id}
              currentUserName={user.name}
              onMessageSent={(msg) => {
                if (msg.status === 'pending') {
                  // Handled by pending queue
                } else {
                  setMessages(prev => [...prev, msg]);
                  setTimeout(() => scrollToBottom('smooth'), 50);
                }
              }}
              pendingMessages={pendingMessages}
              onPendingUpdate={setPendingMessages}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
            Select a conversation to start chatting
          </div>
        )}
      </main>
    </div>
  );
}
