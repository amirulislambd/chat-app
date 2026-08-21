export interface User {
  _id: string;
  name: string;
  phone: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  participants: User[];
  name?: string;
  admins?: string[];
  lastMessage?: {
    text: string;
    createdAt: string;
  };
  updatedAt: string;
}

/** Status progression for my own sent messages */
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'seen';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  // Bonus features
  status?: MessageStatus;     // for sent-by-me messages
  localId?: string;           // temp id for pending (offline) messages
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
