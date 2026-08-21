'use client';

import { useEffect, useState } from 'react';
import { socket } from '../lib/socket';
import { TypingPayload } from '../types';

interface TypingIndicatorProps {
  conversationId: string;
  currentUserId: string;
}

export default function TypingIndicator({ conversationId, currentUserId }: TypingIndicatorProps) {
  // Map of userId → { userName, timer }
  const [typers, setTypers] = useState<Record<string, string>>({}); // userId → userName

  useEffect(() => {
    // Timers map to auto-clear stale indicators (defensive 5s timeout)
    const timers: Record<string, ReturnType<typeof setTimeout>> = {};

    const clearTyper = (userId: string) => {
      setTypers(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      clearTimeout(timers[userId]);
      delete timers[userId];
    };

    const handleStart = (payload: TypingPayload) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.userId === currentUserId) return; // don't show own indicator

      setTypers(prev => ({ ...prev, [payload.userId]: payload.userName }));

      // Defensive 5s auto-clear if typing:stop never arrives
      clearTimeout(timers[payload.userId]);
      timers[payload.userId] = setTimeout(() => clearTyper(payload.userId), 5000);
    };

    const handleStop = (payload: TypingPayload) => {
      if (payload.conversationId !== conversationId) return;
      clearTyper(payload.userId);
    };

    socket.on('typing:start', handleStart);
    socket.on('typing:stop', handleStop);

    return () => {
      socket.off('typing:start', handleStart);
      socket.off('typing:stop', handleStop);
      // Clean up all pending timers
      Object.values(timers).forEach(t => clearTimeout(t));
    };
  }, [conversationId, currentUserId]);

  const names = Object.values(typers);
  if (names.length === 0) return null;

  let label: string;
  if (names.length === 1) {
    label = `${names[0]} is typing…`;
  } else if (names.length === 2) {
    label = `${names[0]} and ${names[1]} are typing…`;
  } else {
    label = `${names[0]} and ${names.length - 1} others are typing…`;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1 text-xs text-gray-500 dark:text-gray-400 italic">
      {/* Animated dots */}
      <span className="flex gap-0.5 items-center">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce [animation-delay:300ms]" />
      </span>
      {label}
    </div>
  );
}
