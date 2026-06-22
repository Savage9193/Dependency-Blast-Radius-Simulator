'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SOCKET_EVENTS } from '@dbrs/shared';
import { useSocketContext } from '@/providers/socket-provider';
import { serviceKeys } from '@/hooks/use-services';
import { dependencyKeys } from '@/hooks/use-dependencies';
import { simulationKeys } from '@/hooks/use-simulations';
import { healthKeys } from '@/hooks/use-health';

export function useSocketEvents() {
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidateServices = () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
      queryClient.invalidateQueries({ queryKey: healthKeys.dashboard() });
    };

    const invalidateDependencies = () => {
      queryClient.invalidateQueries({ queryKey: dependencyKeys.all });
      queryClient.invalidateQueries({ queryKey: healthKeys.dashboard() });
    };

    const invalidateSimulations = () => {
      queryClient.invalidateQueries({ queryKey: simulationKeys.all });
      queryClient.invalidateQueries({ queryKey: healthKeys.dashboard() });
    };

    const invalidateHealth = () => {
      queryClient.invalidateQueries({ queryKey: healthKeys.all });
    };

    socket.on(SOCKET_EVENTS.SERVICE_CREATED, invalidateServices);
    socket.on(SOCKET_EVENTS.SERVICE_UPDATED, invalidateServices);
    socket.on(SOCKET_EVENTS.SERVICE_DELETED, invalidateServices);
    socket.on(SOCKET_EVENTS.DEPENDENCY_CREATED, invalidateDependencies);
    socket.on(SOCKET_EVENTS.DEPENDENCY_DELETED, invalidateDependencies);
    socket.on(SOCKET_EVENTS.SIMULATION_STARTED, invalidateSimulations);
    socket.on(SOCKET_EVENTS.SIMULATION_COMPLETED, invalidateSimulations);
    socket.on(SOCKET_EVENTS.HEALTH_UPDATED, invalidateHealth);
    socket.on(SOCKET_EVENTS.GRAPH_UPDATED, invalidateDependencies);

    return () => {
      socket.off(SOCKET_EVENTS.SERVICE_CREATED, invalidateServices);
      socket.off(SOCKET_EVENTS.SERVICE_UPDATED, invalidateServices);
      socket.off(SOCKET_EVENTS.SERVICE_DELETED, invalidateServices);
      socket.off(SOCKET_EVENTS.DEPENDENCY_CREATED, invalidateDependencies);
      socket.off(SOCKET_EVENTS.DEPENDENCY_DELETED, invalidateDependencies);
      socket.off(SOCKET_EVENTS.SIMULATION_STARTED, invalidateSimulations);
      socket.off(SOCKET_EVENTS.SIMULATION_COMPLETED, invalidateSimulations);
      socket.off(SOCKET_EVENTS.HEALTH_UPDATED, invalidateHealth);
      socket.off(SOCKET_EVENTS.GRAPH_UPDATED, invalidateDependencies);
    };
  }, [socket, queryClient]);
}
