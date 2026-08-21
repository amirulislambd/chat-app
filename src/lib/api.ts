import { User, Conversation, Message, ApiError } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://frontend-task-chatapp.onrender.com/api';

async function fetchWithAuth(url: string, options: RequestInit = {}, token?: string) {
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }
    const message = errorData?.message || errorData?.error || `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, errorData);
  }

  if (response.status === 204) {
    return;
  }

  try {
    return await response.json();
  } catch (err) {
    throw new ApiError(response.status, 'Invalid JSON response from server');
  }
}

function checkShape(data: any, expectedKeys: string[], context: string) {
  if (!data || typeof data !== 'object') {
    console.warn(`[Shape Mismatch] ${context}: Expected object, got ${typeof data}`);
    return;
  }
  const missing = expectedKeys.filter(key => !(key in data));
  if (missing.length > 0) {
    console.warn(`[Shape Mismatch] ${context}: Missing keys: ${missing.join(', ')}. Received:`, data);
  }
}

export const api = {
  async login(phone: string, name: string): Promise<{ token: string; user: User }> {
    const data = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, name })
    });
    checkShape(data, ['token', 'user'], 'login');
    if (data?.user) {
      checkShape(data.user, ['_id', 'phone', 'name', 'createdAt'], 'login.user');
    }
    return data;
  },

  async getMe(token: string): Promise<User> {
    const data = await fetchWithAuth('/auth/me', {}, token);
    checkShape(data, ['_id', 'phone', 'name', 'createdAt'], 'getMe');
    return data;
  },

  async searchUsers(token: string, query: string): Promise<User[]> {
    const data = await fetchWithAuth(`/users/search?q=${encodeURIComponent(query)}`, {}, token);
    if (!Array.isArray(data)) {
      console.warn('[Shape Mismatch] searchUsers: Expected array. Received:', data);
    } else if (data.length > 0) {
      checkShape(data[0], ['_id', 'phone', 'name', 'createdAt'], 'searchUsers[0]');
    }
    return data;
  },

  async getConversations(token: string): Promise<Conversation[]> {
    const data = await fetchWithAuth('/conversations', {}, token);
    if (!Array.isArray(data)) {
      console.warn('[Shape Mismatch] getConversations: Expected array. Received:', data);
    } else if (data.length > 0) {
      checkShape(data[0], ['id', 'type', 'participants', 'updatedAt'], 'getConversations[0]');
    }
    return data;
  },

  async startConversation(token: string, userId: string): Promise<Conversation> {
    const data = await fetchWithAuth('/conversations', {
      method: 'POST',
      body: JSON.stringify({ userId })
    }, token);
    checkShape(data, ['id', 'type', 'participants', 'updatedAt'], 'startConversation');
    return data;
  },

  async createGroup(token: string, name: string, participantIds: string[]): Promise<Conversation> {
    const data = await fetchWithAuth('/conversations/group', {
      method: 'POST',
      body: JSON.stringify({ name, participantIds })
    }, token);
    checkShape(data, ['id', 'type', 'participants', 'updatedAt', 'name'], 'createGroup');
    return data;
  },

  async addParticipants(token: string, conversationId: string, userIds: string[]): Promise<void> {
    await fetchWithAuth(`/conversations/${conversationId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ userIds })
    }, token);
  },

  async removeParticipant(token: string, conversationId: string, userId: string): Promise<void> {
    await fetchWithAuth(`/conversations/${conversationId}/participants/${userId}`, {
      method: 'DELETE'
    }, token);
  },

  async promoteAdmin(token: string, conversationId: string, userId: string): Promise<void> {
    await fetchWithAuth(`/conversations/${conversationId}/admins`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    }, token);
  },

  async renameGroup(token: string, conversationId: string, name: string): Promise<Conversation> {
    const data = await fetchWithAuth(`/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name })
    }, token);
    checkShape(data, ['id', 'type', 'participants', 'updatedAt', 'name'], 'renameGroup');
    return data;
  },

  async getMessages(token: string, conversationId: string): Promise<Message[]> {
    const data = await fetchWithAuth(`/conversations/${conversationId}/messages`, {}, token);
    if (!Array.isArray(data)) {
      console.warn('[Shape Mismatch] getMessages: Expected array. Received:', data);
    } else if (data.length > 0) {
      checkShape(data[0], ['id', 'conversationId', 'senderId', 'text', 'createdAt'], 'getMessages[0]');
    }
    return data;
  },

  async sendMessage(token: string, conversationId: string, text: string): Promise<Message> {
    const data = await fetchWithAuth('/messages', {
      method: 'POST',
      body: JSON.stringify({ conversationId, text })
    }, token);
    checkShape(data, ['id', 'conversationId', 'senderId', 'text', 'createdAt'], 'sendMessage');
    return data;
  }
};
