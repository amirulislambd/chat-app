'use client';

import { Message, MessageStatus } from '../types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean; // true if sent by the current user
}

/** Priority 4: status icon shown only on own messages */
function StatusIcon({ status }: { status?: MessageStatus }) {
  if (!status || status === 'pending') {
    return (
      // Clock icon for pending (offline queue)
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (status === 'sent') {
    // Single check
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white/60" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    );
  }
  if (status === 'delivered') {
    // Double check (grey)
    return (
      <span className="flex">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white/60 -mr-1.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white/60" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </span>
    );
  }
  // seen — double check in blue
  return (
    <span className="flex">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-300 -mr-1.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </span>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const isPending = message.status === 'pending';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm shadow-sm
          ${isOwn
            ? `bg-blue-600 text-white rounded-br-none ${isPending ? 'opacity-60' : ''}`
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
          }`}
      >
        <p className="break-words">{message.text}</p>
        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'}`}>
            {formatTime(message.createdAt)}
          </span>
          {isOwn && <StatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  );
}
