import type {
  AnalyticsTrends,
  ApiError,
  BlastRadiusResult,
  CreateDependencyInput,
  CreateServiceInput,
  CreateSimulationInput,
  CycleDetectionResult,
  Dependency,
  DependencyGraph,
  HealthDashboard,
  PaginatedResponse,
  PathExplorerResult,
  Service,
  ServiceWithCounts,
  SeverityResult,
  Simulation,
  SimulationComparison,
  SimulationResult,
  UpdateServiceInput,
} from '@dbrs/shared';
import type { ServiceFilterInput } from '@dbrs/shared';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}/api/v1${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorBody: ApiError | undefined;
    try {
      errorBody = (await response.json()) as ApiError;
    } catch {
      /* empty body */
    }
    throw new ApiClientError(
      errorBody?.message ?? `Request failed with status ${response.status}`,
      response.status,
      errorBody?.details,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export interface SimulationRunResponse {
  simulation: Simulation;
  blastResult: BlastRadiusResult;
  severity: SeverityResult;
  results: SimulationResult[];
}

export interface SimulationDetailResponse {
  simulation: Simulation;
  results: SimulationResult[];
}

export const api = {
  health: {
    getDashboard: () => request<HealthDashboard>('/health'),
  },

  analytics: {
    getTrends: (days = 30) =>
      request<AnalyticsTrends>(`/analytics${buildQuery({ days })}`),
  },

  services: {
    list: (filters: Partial<ServiceFilterInput> = {}) =>
      request<PaginatedResponse<ServiceWithCounts>>(
        `/services${buildQuery(filters as Record<string, string | number | undefined>)}`,
      ),
    getById: (id: string) => request<ServiceWithCounts>(`/services/${id}`),
    create: (data: CreateServiceInput) =>
      request<Service>('/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateServiceInput) =>
      request<Service>(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/services/${id}`, { method: 'DELETE' }),
  },

  dependencies: {
    list: () => request<Dependency[]>('/dependencies'),
    create: (data: CreateDependencyInput) =>
      request<Dependency>('/dependencies', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/dependencies/${id}`, { method: 'DELETE' }),
    getGraph: () => request<DependencyGraph>('/dependencies/graph'),
    detectCycles: () => request<CycleDetectionResult>('/dependencies/cycles'),
    explorePath: (rootServiceId: string, targetServiceId: string) =>
      request<PathExplorerResult>(
        `/dependencies/paths${buildQuery({ rootServiceId, targetServiceId })}`,
      ),
  },

  simulations: {
    run: (data: CreateSimulationInput) =>
      request<SimulationRunResponse>('/simulations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: (page = 1, limit = 20) =>
      request<PaginatedResponse<Simulation>>(
        `/simulations${buildQuery({ page, limit })}`,
      ),
    getById: (id: string) => request<SimulationDetailResponse>(`/simulations/${id}`),
    rerun: (id: string) =>
      request<SimulationRunResponse>(`/simulations/${id}/rerun`, { method: 'POST' }),
    compare: (simulationIds: string[]) =>
      request<SimulationComparison>('/simulations/compare', {
        method: 'POST',
        body: JSON.stringify({ simulationIds }),
      }),
  },
};

export { API_BASE };
