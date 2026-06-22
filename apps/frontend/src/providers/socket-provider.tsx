'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { connectSocket, disconnectSocket, getSocket, getSocketStatus } from '@/lib/socket';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

interface SocketContextValue {
  status: ConnectionStatus;
  socket: ReturnType<typeof getSocket>;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const socket = getSocket();

  useEffect(() => {
    const s = connectSocket();

    const onConnect = () => setStatus('connected');
    const onDisconnect = () => setStatus('disconnected');
    const onReconnectAttempt = () => setStatus('connecting');

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.io.on('reconnect_attempt', onReconnectAttempt);

    setStatus(getSocketStatus());

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.io.off('reconnect_attempt', onReconnectAttempt);
      disconnectSocket();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ status, socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  return ctx;
}
