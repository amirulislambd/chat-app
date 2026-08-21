'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { socket } from '../lib/socket';
import { Message, MessageStatus, TypingPayload } from '../types';
import { api } from '../lib/api';

interface MessageInputProps {
  conversationId: string;
  token: string;
  currentUserId: string;
  currentUserName: string;
  onMessageSent: (message: Message) => void;
  /** Pending offline messages waiting to be flushed */
  pendingMessages: Message[];
  onPendingUpdate: React.Dispatch<React.SetStateAction<Message[]>>;
}

const TYPING_STOP_DELAY = 3000; // ms of inactivity before typing:stop
const TYPING_RESUME_DELAY = 3000; // ms after which re-emitting typing:start on resume

export default function MessageInput({
  conversationId,
  token,
  currentUserId,
  currentUserName,
  onMessageSent,
  pendingMessages,
  onPendingUpdate,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Refs for typing indicator state (don't need re-renders)
  const isTypingRef = useRef(false);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmitRef = useRef<number>(0);

  const typingPayload = (): TypingPayload => ({
    conversationId,
    userId: currentUserId,
    userName: currentUserName,
  });

  const emitTypingStart = useCallback(() => {
    const now = Date.now();
    // Re-emit if more than TYPING_RESUME_DELAY has passed since last emit
    if (!isTypingRef.current || now - lastTypingEmitRef.current > TYPING_RESUME_DELAY) {
      socket.emit('typing:start', typingPayload());
      isTypingRef.current = true;
      lastTypingEmitRef.current = now;
    }
  }, [conversationId, currentUserId, currentUserName]);

  const emitTypingStop = useCallback(() => {
    if (isTypingRef.current) {
      socket.emit('typing:stop', typingPayload());
      isTypingRef.current = false;
    }
  }, [conversationId, currentUserId, currentUserName]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    if (e.target.value.trim()) {
      emitTypingStart();
      // Reset the stop timer on every keystroke
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = setTimeout(() => {
        emitTypingStop();
      }, TYPING_STOP_DELAY);
    } else {
      // Text cleared — stop immediately
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      emitTypingStop();
    }
  };

  // Clean up timer on unmount or conversation change
  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      emitTypingStop();
    };
  }, [conversationId]);

  // PRIORITY 3: Flush pending messages when socket reconnects
  useEffect(() => {
    const flushPending = async () => {
      if (pendingMessages.length === 0) return;
      const toFlush = [...pendingMessages];
      onPendingUpdate([]); // optimistically clear queue

      for (const pm of toFlush) {
        try {
          const sent = await api.sendMessage(token, pm.conversationId, pm.text);
          onMessageSent({ ...sent, status: 'sent' });
        } catch {
          // Re-queue on failure
          onPendingUpdate(prev => [...prev, pm]);
        }
      }
    };

    socket.on('connect', flushPending);
    return () => { socket.off('connect', flushPending); };
  }, [pendingMessages, token, conversationId]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    // Stop typing indicator
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    emitTypingStop();
    setText('');

    // PRIORITY 3: If offline or socket disconnected, queue the message
    if (!navigator.onLine || !socket.connected) {
      const pending: Message = {
        id: '',
        localId: `local_${Date.now()}`,
        conversationId,
        senderId: currentUserId,
        text: trimmed,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      onPendingUpdate(prev => [...prev, pending]);
      onMessageSent(pending); // Show optimistically in the list
      return;
    }

    setIsSending(true);
    try {
      const sent = await api.sendMessage(token, conversationId, trimmed);
      onMessageSent({ ...sent, status: 'sent' });
    } catch (err) {
      // On failure, queue it
      const pending: Message = {
        id: '',
        localId: `local_${Date.now()}`,
        conversationId,
        senderId: currentUserId,
        text: trimmed,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      onPendingUpdate(prev => [...prev, pending]);
      onMessageSent(pending);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = text.trim().length > 0 && !isSending;

  return (
    <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-end gap-2">
      <textarea
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message…"
        rows={1}
        className="flex-1 resize-none px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm max-h-32 overflow-y-auto"
      />
      <button
        onClick={handleSend}
        disabled={!canSend}
        className="flex-shrink-0 p-2.5 bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white rounded-full transition-colors hover:bg-blue-700"
        aria-label="Send message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  );
}
