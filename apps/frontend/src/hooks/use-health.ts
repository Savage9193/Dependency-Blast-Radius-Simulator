import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const healthKeys = {
  all: ['health'] as const,
  dashboard: () => [...healthKeys.all, 'dashboard'] as const,
};

export function useHealthDashboard() {
  return useQuery({
    queryKey: healthKeys.dashboard(),
    queryFn: () => api.health.getDashboard(),
  });
}

export function useAnalytics(days = 30) {
  return useQuery({
    queryKey: ['analytics', days],
    queryFn: () => api.analytics.getTrends(days),
  });
}
