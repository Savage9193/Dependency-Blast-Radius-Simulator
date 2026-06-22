import type { ServiceRow } from '../db/schema';
import type { Service } from '@dbrs/shared';
import { Criticality, ServiceStatus } from '@dbrs/shared';

export function toService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    owner: row.owner,
    team: row.team,
    criticality: row.criticality as Criticality,
    status: row.status as ServiceStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function buildAdjacencyList(
  edges: Array<{ sourceServiceId: string; targetServiceId: string }>,
): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const dependents = adjacency.get(edge.targetServiceId) ?? [];
    dependents.push(edge.sourceServiceId);
    adjacency.set(edge.targetServiceId, dependents);

    if (!adjacency.has(edge.sourceServiceId)) {
      adjacency.set(edge.sourceServiceId, []);
    }
  }
  return adjacency;
}

export function buildReverseAdjacencyList(
  edges: Array<{ sourceServiceId: string; targetServiceId: string }>,
): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const deps = adjacency.get(edge.sourceServiceId) ?? [];
    deps.push(edge.targetServiceId);
    adjacency.set(edge.sourceServiceId, deps);

    if (!adjacency.has(edge.targetServiceId)) {
      adjacency.set(edge.targetServiceId, []);
    }
  }
  return adjacency;
}

export type { Service };
