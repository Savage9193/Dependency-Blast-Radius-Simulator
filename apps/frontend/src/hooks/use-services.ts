import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateServiceInput, ServiceFilterInput, UpdateServiceInput } from '@dbrs/shared';
import { api } from '@/lib/api';
import { useUiStore } from '@/store/ui-store';

export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (filters: Partial<ServiceFilterInput>) =>
    [...serviceKeys.lists(), filters] as const,
  detail: (id: string) => [...serviceKeys.all, 'detail', id] as const,
};

export function useServices(filters: Partial<ServiceFilterInput> = {}) {
  return useQuery({
    queryKey: serviceKeys.list(filters),
    queryFn: () => api.services.list(filters),
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => api.services.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: (data: CreateServiceInput) => api.services.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
      addToast({ title: 'Service created', variant: 'success' });
    },
    onError: (error: Error) => {
      addToast({ title: 'Failed to create service', message: error.message, variant: 'error' });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceInput }) =>
      api.services.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(id) });
      addToast({ title: 'Service updated', variant: 'success' });
    },
    onError: (error: Error) => {
      addToast({ title: 'Failed to update service', message: error.message, variant: 'error' });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);

  return useMutation({
    mutationFn: (id: string) => api.services.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
      addToast({ title: 'Service deleted', variant: 'success' });
    },
    onError: (error: Error) => {
      addToast({ title: 'Failed to delete service', message: error.message, variant: 'error' });
    },
  });
}
