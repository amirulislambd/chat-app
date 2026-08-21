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
import { Message, Conversation, SeenPayload, User } from "@/src/types";

export default function ChatPage() {
  const { token, user } = useAuth();
  const router = useRouter();

  // Persist selected conversation across reloads
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedConversationId') || null;
    }
    return null;
  });

  const handleSelectConversation = (
    id: string | null,
    conversation?: Conversation,
  ) => {
    setSelectedConversationId(id);
    setSelectedConversation(conversation || null);
    if (id) {
      localStorage.setItem("selectedConversationId", id);
    } else {
      localStorage.removeItem("selectedConversationId");
    }
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string | null>(null);

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handleMouseMove = (event: MouseEvent) => {
      setSidebarWidth(Math.min(420, Math.max(220, event.clientX)));
    };
    const stopResizing = () => setIsResizingSidebar(false);

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResizing);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizingSidebar]);
  
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

  const fetchMsgs = useCallback(async () => {
    if (!token || !selectedConversationId) return;
    setLoadingMessages(true);
    setErrorMessages(null);
    try {
      const data = await api.getMessages(token, selectedConversationId);
      // Sort oldest to newest (ascending) so new messages appear at bottom
      const sorted = [...data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      // Priority 4: assume fetched messages are already 'seen' or 'delivered' by definition of being in DB
      setMessages(sorted.map(m => ({ ...m, status: 'seen' })));
      // Wait for render then scroll
      setTimeout(() => scrollToBottom('auto'), 100);
    } catch (err: any) {
      console.error('Failed to load messages', err);
      setErrorMessages(err.message || 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, [token, selectedConversationId]);

  // Fetch messages when conversation changes
  useEffect(() => {
    fetchMsgs();
  }, [fetchMsgs]);

  // Handle incoming real-time messages & seen receipts
  useEffect(() => {
    if (!selectedConversationId || !user) return;

    const handleNewMessage = (msg: Message) => {
      if (msg.conversation === selectedConversationId) {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, { ...msg, status: 'delivered' }];
        });

        const container = scrollContainerRef.current;
        if (container) {
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
          if (isNearBottom || msg.sender === user._id) {
            setTimeout(() => scrollToBottom('smooth'), 50);
          }
        }

        socket.emit('message:seen', {
          conversationId: selectedConversationId,
          lastSeenMessageId: msg._id,
          userId: user._id
        } as SeenPayload);
      }

      // Play a notification ping for messages NOT sent by me
      if (msg.sender !== user._id) {
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.4);
        } catch (_) {
          // Browsers may block AudioContext before user interaction — silent fail
        }
      }
    };

    const handleMessageSeen = (payload: SeenPayload) => {
      if (payload.conversationId === selectedConversationId && payload.userId !== user._id) {
        // Mark all my messages in this convo up to lastSeenMessageId as seen
        setMessages(prev => prev.map(m => 
          m.sender === user._id ? { ...m, status: 'seen' } : m
        ));
      }
    };

    const handleReconnect = () => {
      // Re-fetch messages if the socket drops and reconnects, to avoid missing any messages
      fetchMsgs();
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:seen', handleMessageSeen);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:seen', handleMessageSeen);
      socket.off('connect', handleReconnect);
    };
  }, [selectedConversationId, user, fetchMsgs]);

  if (!user || !token) {
    return <div className="h-screen bg-white dark:bg-gray-900" />;
  }

  // Combine real and pending messages for display
  const allMessages = [...messages, ...pendingMessages.filter(p => p.conversation === selectedConversationId)];

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      <OfflineBanner />
      <div className="mx-auto flex h-full min-h-0 w-full  overflow-hidden md:px-4 lg:px-6">
        {/* Sidebar: ConversationList */}
        <ConversationList
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          width={sidebarWidth}
          onResizeStart={() => setIsResizingSidebar(true)}
          className={selectedConversationId ? "hidden md:flex" : "flex"}
        />

        {/* Main Content: Chat Panel */}
        <main
          className={`flex h-full min-h-0 flex-1 flex-col min-w-0 bg-white dark:bg-gray-800 relative ${!selectedConversationId ? "hidden md:flex" : "flex"}`}
        >
          {selectedConversationId ? (
            <>
              {/* Header */}
              <div className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 bg-white dark:bg-gray-800 shadow-sm z-10 flex-shrink-0 gap-3">
                <button
                  onClick={() => handleSelectConversation(null)}
                  className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Chat
                </h3>
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
                ) : errorMessages ? (
                  <div className="flex flex-col justify-center items-center h-full text-center">
                    <p className="text-red-500 dark:text-red-400 mb-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                      {errorMessages}
                    </p>
                    <button
                      onClick={fetchMsgs}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors shadow-sm"
                    >
                      Retry Loading Messages
                    </button>
                  </div>
                ) : allMessages.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">
                    <div className="bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-lg text-sm shadow-sm backdrop-blur-sm">
                      No messages yet. Send a message to start the conversation!
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {allMessages.map((msg, messageIndex) => {
                      const sender =
                        msg.sender === user._id
                          ? user
                          : selectedConversation?.participant ||
                            (Array.isArray(selectedConversation?.participants)
                              ? selectedConversation.participants.find(
                                  (participant): participant is User =>
                                    typeof participant !== "string" &&
                                    participant._id === msg.sender,
                                )
                              : undefined);
                      return (
                        <MessageBubble
                          key={`${msg._id || msg.localId || "message"}-${messageIndex}`}
                          message={msg}
                          isOwn={msg.sender === user._id}
                          sender={sender}
                        />
                      );
                    })}
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
                  if (msg.status === "pending") {
                    // Handled by pending queue
                  } else {
                    setMessages((prev) => [...prev, msg]);
                    setTimeout(() => scrollToBottom("smooth"), 50);
                  }
                }}
                pendingMessages={pendingMessages}
                onPendingUpdate={setPendingMessages}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 bg-gray-50 dark:bg-gray-900">
              <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-inner">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  ChatApp Web
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                  Select a conversation from the sidebar to start chatting. Your
                  messages are end-to-end secure.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
