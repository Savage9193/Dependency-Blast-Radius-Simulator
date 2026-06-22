import { EventEmitter } from 'events';
import { SOCKET_EVENTS } from '@dbrs/shared';

class AppEventEmitter extends EventEmitter {
  emitServiceCreated(data: unknown) {
    this.emit(SOCKET_EVENTS.SERVICE_CREATED, data);
  }

  emitServiceUpdated(data: unknown) {
    this.emit(SOCKET_EVENTS.SERVICE_UPDATED, data);
  }

  emitServiceDeleted(data: unknown) {
    this.emit(SOCKET_EVENTS.SERVICE_DELETED, data);
  }

  emitDependencyCreated(data: unknown) {
    this.emit(SOCKET_EVENTS.DEPENDENCY_CREATED, data);
  }

  emitDependencyDeleted(data: unknown) {
    this.emit(SOCKET_EVENTS.DEPENDENCY_DELETED, data);
  }

  emitSimulationStarted(data: unknown) {
    this.emit(SOCKET_EVENTS.SIMULATION_STARTED, data);
  }

  emitSimulationCompleted(data: unknown) {
    this.emit(SOCKET_EVENTS.SIMULATION_COMPLETED, data);
  }

  emitHealthUpdated(data: unknown) {
    this.emit(SOCKET_EVENTS.HEALTH_UPDATED, data);
  }

  emitGraphUpdated(data: unknown) {
    this.emit(SOCKET_EVENTS.GRAPH_UPDATED, data);
  }
}

export const appEvents = new AppEventEmitter();
