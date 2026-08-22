'use client';

import { useRef, useState } from "react";
import { Message, MessageStatus, User } from "../types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean; // true if sent by the current user
  sender?: User;
  onReply?: (message: Message, senderName: string) => void;
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

function LinkifiedText({ text, isOwn }: { text: string; isOwn: boolean }) {
  const urlPattern = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlPattern.exec(text)) !== null) {
    const rawUrl = match[0];
    const trailingPunctuation = rawUrl.match(/[),.!?;:]+$/)?.[0] || "";
    const url = trailingPunctuation
      ? rawUrl.slice(0, -trailingPunctuation.length)
      : rawUrl;

    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <a
        key={`${match.index}-${url}`}
        href={url.startsWith("www.") ? `https://${url}` : url}
        target="_blank"
        rel="noreferrer noopener"
        className={`break-all underline decoration-1 underline-offset-2 transition-opacity hover:opacity-75 ${isOwn ? "text-white" : "text-blue-600 dark:text-blue-300"}`}
      >
        {url}
      </a>,
    );
    if (trailingPunctuation) parts.push(trailingPunctuation);
    lastIndex = match.index + rawUrl.length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
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
  onReply,
}: MessageBubbleProps) {
  const isPending = message.status === "pending";
  const [showProfile, setShowProfile] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef<number | null>(null);
  const parsedReply = message.text.match(
    /^Replying to (.*?): "([\s\S]*)"\n([\s\S]*)$/,
  );
  const reply =
    message.replyTo ||
    (parsedReply
      ? { senderName: parsedReply[1], text: parsedReply[2] }
      : undefined);
  const replyPrefix = message.replyTo
    ? `Replying to ${message.replyTo.senderName}: "${message.replyTo.text}"\n`
    : parsedReply
      ? parsedReply[0].slice(0, parsedReply[0].length - parsedReply[3].length)
      : "";
  const displayedText = replyPrefix
    ? message.text.slice(replyPrefix.length)
    : message.text;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    const distance = event.clientX - dragStartX.current;
    const direction = isOwn ? Math.min(0, distance) : Math.max(0, distance);
    setDragOffset(Math.max(-72, Math.min(72, direction)));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      dragStartX.current !== null &&
      Math.abs(event.clientX - dragStartX.current) > 56
    ) {
      onReply?.(message, sender?.name || (isOwn ? "You" : "User"));
    }
    dragStartX.current = null;
    setDragOffset(0);
  };

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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragStartX.current = null;
        }}
        style={{ transform: `translateX(${dragOffset}px)` }}
        className={`relative min-w-0 max-w-[calc(100%-1.5rem)] rounded-[1.1rem] px-3 py-2 text-xs shadow-[0_3px_12px_rgba(15,23,42,0.08)] transition-transform md:max-w-[70%] md:rounded-[1.35rem] md:px-4 md:py-2.5 md:text-base
          ${
            isOwn
              ? `rounded-br-md bg-blue-600 text-white shadow-[0_4px_14px_rgba(37,99,235,0.2)] ${isPending ? "opacity-60" : ""}`
              : "rounded-bl-md border border-gray-200/80 bg-white text-gray-900 shadow-[0_3px_12px_rgba(15,23,42,0.1)] dark:border-gray-600/70 dark:bg-gray-700/90 dark:text-gray-100 dark:shadow-[0_3px_12px_rgba(0,0,0,0.16)]"
          }`}
      >
        {dragOffset !== 0 && (
          <span
            className={`absolute top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-300 ${isOwn ? "-left-8" : "-right-8"}`}
          >
            {Math.abs(dragOffset) > 56 ? "↩" : "→"}
          </span>
        )}
        {reply && (
          <div className="mb-1.5 border-l-2 border-current/50 pl-2 text-[10px] opacity-75 md:text-xs">
            <p className="font-semibold">{reply.senderName}</p>
            <p className="truncate">{reply.text}</p>
          </div>
        )}
        <p className="wrap-break-word">
          <LinkifiedText text={displayedText} isOwn={isOwn} />
        </p>
        <div
          className={`mt-1 flex items-center gap-1 ${isOwn ? "justify-end" : "justify-start"}`}
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
