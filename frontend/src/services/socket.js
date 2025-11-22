// src/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

export const connectSocket = (userData) => {
  if (!socket.connected) {
    socket.connect();
    socket.emit('join-dashboard', userData);
    console.log('🔌 Socket connected for:', userData.email);
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log('🔌 Socket disconnected');
  }
};

export const onSocketEvent = (eventName, callback) => {
  socket.on(eventName, callback);
};

export const offSocketEvent = (eventName, callback) => {
  socket.off(eventName, callback);
};

export const getSocket = () => socket;

export default socket;
