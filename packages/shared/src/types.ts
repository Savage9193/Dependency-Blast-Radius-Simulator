import {
  Criticality,
  ServiceStatus,
  ImpactType,
  SeverityClassification,
  AuditAction,
  AuditEntityType,
} from './enums';

export interface Service {
  id: string;
  name: string;
  description: string;
  owner: string;
  team: string;
  criticality: Criticality;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceWithCounts extends Service {
  upstreamCount: number;
  downstreamCount: number;
  totalDependencies: number;
}

export interface Dependency {
  id: string;
  sourceServiceId: string;
  targetServiceId: string;
  createdAt: string;
}

export interface GraphNode {
  id: string;
  name: string;
  criticality: Criticality;
  status: ServiceStatus;
  team: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface CycleDetectionResult {
  hasCycle: boolean;
  cyclePath?: string[];
  cycleServices?: string[];
}

export interface BlastRadiusResult {
  failedServices: string[];
  directlyImpacted: string[];
  indirectlyImpacted: string[];
  allImpacted: string[];
  impactPaths: Record<string, string[][]>;
  impactDepths: Record<string, number>;
  totalImpacted: number;
  summary: {
    directCount: number;
    indirectCount: number;
    maxDepth: number;
  };
}

export interface SeverityResult {
  score: number;
  classification: SeverityClassification;
  breakdown: {
    affectedScore: number;
    depthScore: number;
    criticalityScore: number;
    rootScore: number;
  };
}

export interface PathExplorerResult {
  rootServiceId: string;
  targetServiceId: string;
  shortestPath: string[] | null;
  longestPath: string[] | null;
  allPaths: string[][];
  traversalDepth: number;
}

export interface Simulation {
  id: string;
  name: string;
  failedServices: string[];
  totalImpacted: number;
  severityScore: number;
  metadata: SimulationMetadata;
  createdAt: string;
}

export interface SimulationMetadata {
  severityClassification: SeverityClassification;
  graphSnapshot: DependencyGraph;
  failedServiceNames: string[];
  breakdown: SeverityResult['breakdown'];
}

export interface SimulationResult {
  id: string;
  simulationId: string;
  serviceId: string;
  impactType: ImpactType;
  impactDepth: number;
  dependencyPath: string[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface HealthDashboard {
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  failedServices: number;
  totalDependencies: number;
  averageDependencyDepth: number;
  criticalServices: number;
  mostConnectedServices: Array<{ id: string; name: string; connectionCount: number }>;
  simulationsCount: number;
  recentSimulations: Simulation[];
}

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

export interface SimulationComparison {
  simulations: Simulation[];
  commonFailedServices: string[];
  uniqueImpacts: Record<string, string[]>;
  severityDelta: Record<string, number>;
}

export interface AnalyticsTrends {
  blastRadiusTrend: Array<{ date: string; totalImpacted: number }>;
  severityTrend: Array<{ date: string; severityScore: number }>;
  mostImpactedServices: Array<{ serviceId: string; serviceName: string; impactCount: number }>;
  criticalityDistribution: Array<{ criticality: Criticality; count: number }>;
  dependencyDepthDistribution: Array<{ depth: number; count: number }>;
  simulationTrend: Array<{ date: string; count: number }>;
}
