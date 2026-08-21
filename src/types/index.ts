export interface User {
  _id: string;
  name: string;
  phone: string;
  createdAt?: string;
}

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  participants?: string[] | User[]; // Group chats might return array of IDs or Users
  participant?: User; // Direct chats return the other user here
  name?: string;
  admins?: string[];
  lastMessage?: {
    text?: string;
    createdAt?: string;
  };
  unreadCount?: number;
  updatedAt: string;
}

/** Status progression for my own sent messages */
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'seen';

export interface Message {
  _id: string;
  conversation: string; // the API uses 'conversation' instead of 'conversationId'
  sender: string; // the API uses 'sender' instead of 'senderId'
  text: string;
  createdAt: string;
  // Bonus features
  status?: MessageStatus; // for sent-by-me messages
  localId?: string; // temp id for pending (offline) messages
  replyTo?: {
    senderName: string;
    text: string;
  };
}

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/** Typing indicator payload used over socket */
export interface TypingPayload {
  conversationId: string;
  userId: string;
  userName: string;
}

/** socket: message:seen payload */
export interface SeenPayload {
  conversationId: string;
  lastSeenMessageId: string;
  userId: string;
}
