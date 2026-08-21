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

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
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
