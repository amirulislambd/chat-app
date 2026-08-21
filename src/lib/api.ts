export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://frontend-task-chatapp.onrender.com/api';

// Fetch wrapper for the REST API
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, options);
  return response.json();
}
