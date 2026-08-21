import { io } from 'socket.io-client';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  'https://frontend-task-chatapp.onrender.com';

// Singleton socket — auth token is injected before connect() is called.
export const socket = io(SOCKET_URL, {
  autoConnect: false, // Connect manually after the JWT token is available
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

/** Call once after login to inject the JWT and open the connection. */
export function connectSocket(token: string) {
  socket.auth = { token };
  if (!socket.connected) {
    socket.connect();
  }
}

/** Call on logout to cleanly close the connection. */
export function disconnectSocket() {
  socket.disconnect();
}
