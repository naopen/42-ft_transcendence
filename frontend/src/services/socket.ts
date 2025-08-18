import { io, Socket } from 'socket.io-client';

// Dynamically get WebSocket URL to avoid caching issues
const getWsUrl = () => {
  // Use current domain for WebSocket connection
  const currentUrl = window.location.origin;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  
  // If we're in development mode and have VITE_WS_URL set, use it
  if (import.meta.env.DEV && import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  
  // Otherwise, use current domain with appropriate protocol
  return `${protocol}//${host}`;
};

let socket: Socket | null = null;

export const connectSocket = (userId: number): Socket => {
  if (socket?.connected) {
    return socket;
  }

  const wsUrl = getWsUrl();
  console.log('Connecting to WebSocket:', wsUrl);
  
  socket = io(wsUrl, {
    withCredentials: true,
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
    socket?.emit('authenticate', { userId });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error: any) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;

export default {
  connectSocket,
  disconnectSocket,
  getSocket,
};
