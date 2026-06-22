import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateSimulationInput } from '@dbrs/shared';
import { api } from '@/lib/api';
import { healthKeys } from '@/hooks/use-health';
import { useUiStore } from '@/store/ui-store';

export const simulationKeys = {
  all: ['simulations'] as const,
  lists: () => [...simulationKeys.all, 'list'] as const,
  list: (page: number, limit: number) => [...simulationKeys.lists(), page, limit] as const,
  detail: (id: string) => [...simulationKeys.all, 'detail', id] as const,
};

export function useSimulations(page = 1, limit = 20) {
  return useQuery({
    queryKey: simulationKeys.list(page, limit),
    queryFn: () => api.simulations.list(page, limit),
  });
}

export function useSimulation(id: string) {
  return useQuery({
    queryKey: simulationKeys.detail(id),
    queryFn: () => api.simulations.getById(id),
    enabled: Boolean(id),
  });
}

export function useRunSimulation() {
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: (data: CreateSimulationInput) => api.simulations.run(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: simulationKeys.all });
      queryClient.invalidateQueries({ queryKey: healthKeys.dashboard() });
      addToast({ title: 'Simulation completed', variant: 'success' });
    },
    onError: (error: Error) => {
      addToast({ title: 'Simulation failed', message: error.message, variant: 'error' });
    },
  });
}

export function useRerunSimulation() {
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: (id: string) => api.simulations.rerun(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: simulationKeys.all });
      queryClient.invalidateQueries({ queryKey: healthKeys.dashboard() });
      addToast({ title: 'Simulation rerun completed', variant: 'success' });
    },
    onError: (error: Error) => {
      addToast({ title: 'Rerun failed', message: error.message, variant: 'error' });
    },
  });
}

export function useCompareSimulations() {
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: (simulationIds: string[]) => api.simulations.compare(simulationIds),
    onError: (error: Error) => {
      addToast({ title: 'Comparison failed', message: error.message, variant: 'error' });
    },
  });
}
