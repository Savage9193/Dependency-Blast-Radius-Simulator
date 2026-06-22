export const API_VERSION = 'v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const SOCKET_EVENTS = {
  SERVICE_CREATED: 'service:created',
  SERVICE_UPDATED: 'service:updated',
  SERVICE_DELETED: 'service:deleted',
  DEPENDENCY_CREATED: 'dependency:created',
  DEPENDENCY_DELETED: 'dependency:deleted',
  SIMULATION_STARTED: 'simulation:started',
  SIMULATION_COMPLETED: 'simulation:completed',
  HEALTH_UPDATED: 'health:updated',
  GRAPH_UPDATED: 'graph:updated',
} as const;
