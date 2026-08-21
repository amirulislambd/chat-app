'use client';

import { useState } from "react";
import { Message, MessageStatus, User } from "../types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean; // true if sent by the current user
  sender?: User;
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

function initials(name?: string) {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

function ProfilePopover({ user, isOwn }: { user?: User; isOwn: boolean }) {
  if (!user) return null;

  return (
    <div
      className={`absolute bottom-7 z-20 w-44 rounded-lg border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-600 dark:bg-gray-800 md:bottom-8 md:w-52 md:rounded-xl md:p-3 ${isOwn ? "right-0" : "left-0"}`}
    >
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-[10px] font-bold text-white md:h-8 md:w-8 md:text-xs">
          {initials(user.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {user.name}
          </p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {user.phone}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MessageBubble({
  message,
  isOwn,
  sender,
}: MessageBubbleProps) {
  const isPending = message.status === "pending";
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div
      className={`flex min-w-0 items-end gap-1 ${isOwn ? "justify-end" : "justify-start"} mb-1`}
    >
      {!isOwn && (
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowProfile((value) => !value)}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-[9px] font-bold text-white shadow-sm hover:ring-2 hover:ring-blue-300 md:h-6 md:w-6 md:text-[10px]"
            aria-label={`View ${sender?.name || "sender"} profile`}
          >
            {initials(sender?.name)}
          </button>
          {showProfile && <ProfilePopover user={sender} isOwn={isOwn} />}
        </div>
      )}
      <div
        className={`min-w-0 max-w-[calc(100%-1.5rem)] rounded-xl px-2 py-1.5 text-xs shadow-sm md:max-w-[70%] md:rounded-2xl md:px-4 md:py-2.5 md:text-base
          ${
            isOwn
              ? `bg-blue-600 text-white rounded-br-none ${isPending ? "opacity-60" : ""}`
              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
          }`}
      >
        <p className="wrap-break-word">{message.text}</p>
        <div
          className={`flex items-center gap-1 mt-0.5 ${isOwn ? "justify-end" : "justify-start"}`}
        >
          <span
            className={`text-[10px] md:text-xs ${isOwn ? "text-white/60" : "text-gray-500 dark:text-gray-400"}`}
          >
            {formatTime(message.createdAt)}
          </span>
          {isOwn && <StatusIcon status={message.status} />}
        </div>
      </div>
      {isOwn && (
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowProfile((value) => !value)}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-teal-500 text-[9px] font-bold text-white shadow-sm hover:ring-2 hover:ring-green-300 md:h-6 md:w-6 md:text-[10px]"
            aria-label={`View ${sender?.name || "your"} profile`}
          >
            {initials(sender?.name)}
          </button>
          {showProfile && <ProfilePopover user={sender} isOwn={isOwn} />}
        </div>
      )}
    </div>
  );
}
