import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

let socket: Socket | null = null;

export const connectSocket = (userId: number): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(WS_URL, {
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
