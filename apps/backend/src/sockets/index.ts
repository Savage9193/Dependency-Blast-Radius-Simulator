import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '@dbrs/shared';
import { appEvents } from '../events/app-events';
import { getEnv } from '../config/env';

let io: Server | null = null;

export function initSocketServer(httpServer: HttpServer): Server {
  const env = getEnv();

  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    socket.join('dashboard');

    socket.on('disconnect', () => {
      // Client disconnected
    });

    socket.on('reconnect_attempt', () => {
      socket.emit('reconnecting');
    });
  });

  appEvents.on(SOCKET_EVENTS.SERVICE_CREATED, (data) => {
    io?.to('dashboard').emit(SOCKET_EVENTS.SERVICE_CREATED, data);
  });

  appEvents.on(SOCKET_EVENTS.SERVICE_UPDATED, (data) => {
    io?.to('dashboard').emit(SOCKET_EVENTS.SERVICE_UPDATED, data);
  });

  appEvents.on(SOCKET_EVENTS.SERVICE_DELETED, (data) => {
    io?.to('dashboard').emit(SOCKET_EVENTS.SERVICE_DELETED, data);
  });

  appEvents.on(SOCKET_EVENTS.DEPENDENCY_CREATED, (data) => {
    io?.to('dashboard').emit(SOCKET_EVENTS.DEPENDENCY_CREATED, data);
    io?.to('dashboard').emit(SOCKET_EVENTS.GRAPH_UPDATED, data);
  });

  appEvents.on(SOCKET_EVENTS.DEPENDENCY_DELETED, (data) => {
    io?.to('dashboard').emit(SOCKET_EVENTS.DEPENDENCY_DELETED, data);
    io?.to('dashboard').emit(SOCKET_EVENTS.GRAPH_UPDATED, data);
  });

  appEvents.on(SOCKET_EVENTS.SIMULATION_STARTED, (data) => {
    io?.to('dashboard').emit(SOCKET_EVENTS.SIMULATION_STARTED, data);
  });

  appEvents.on(SOCKET_EVENTS.SIMULATION_COMPLETED, (data) => {
    io?.to('dashboard').emit(SOCKET_EVENTS.SIMULATION_COMPLETED, data);
  });

  appEvents.on(SOCKET_EVENTS.HEALTH_UPDATED, (data) => {
    io?.to('dashboard').emit(SOCKET_EVENTS.HEALTH_UPDATED, data);
  });

  appEvents.on(SOCKET_EVENTS.GRAPH_UPDATED, (data) => {
    io?.to('dashboard').emit(SOCKET_EVENTS.GRAPH_UPDATED, data);
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}
