import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateDependencyInput } from '@dbrs/shared';
import { api } from '@/lib/api';
import { useUiStore } from '@/store/ui-store';

export const dependencyKeys = {
  all: ['dependencies'] as const,
  list: () => [...dependencyKeys.all, 'list'] as const,
  graph: () => [...dependencyKeys.all, 'graph'] as const,
  cycles: () => [...dependencyKeys.all, 'cycles'] as const,
  paths: (root: string, target: string) =>
    [...dependencyKeys.all, 'paths', root, target] as const,
};

export function useDependencies() {
  return useQuery({
    queryKey: dependencyKeys.list(),
    queryFn: () => api.dependencies.list(),
  });
}

export function useDependencyGraph() {
  return useQuery({
    queryKey: dependencyKeys.graph(),
    queryFn: () => api.dependencies.getGraph(),
  });
}

export function useDependencyCycles() {
  return useQuery({
    queryKey: dependencyKeys.cycles(),
    queryFn: () => api.dependencies.detectCycles(),
  });
}

export function useDependencyPaths(rootServiceId: string, targetServiceId: string) {
  return useQuery({
    queryKey: dependencyKeys.paths(rootServiceId, targetServiceId),
    queryFn: () => api.dependencies.explorePath(rootServiceId, targetServiceId),
    enabled: Boolean(rootServiceId && targetServiceId),
  });
}

export function useCreateDependency() {
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: (data: CreateDependencyInput) => api.dependencies.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dependencyKeys.all });
      addToast({ title: 'Dependency created', variant: 'success' });
    },
    onError: (error: Error) => {
      addToast({ title: 'Failed to create dependency', message: error.message, variant: 'error' });
    },
  });
}

export function useDeleteDependency() {
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: (id: string) => api.dependencies.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dependencyKeys.all });
      addToast({ title: 'Dependency deleted', variant: 'success' });
    },
    onError: (error: Error) => {
      addToast({ title: 'Failed to delete dependency', message: error.message, variant: 'error' });
    },
  });
}
