import type { BlastRadiusResult } from '@dbrs/shared';
import { buildAdjacencyList } from '../../utils/mappers';

/**
 * Blast radius engine: when services fail, find all upstream dependents
 * that would be impacted through the dependency graph.
 *
 * Edge direction: source depends on target (source -> target means source needs target)
 * When target fails, source is impacted.
 */
export class BlastRadiusEngine {
  private adjacency: Map<string, string[]>;
  private allServiceIds: Set<string>;

  constructor(edges: Array<{ sourceServiceId: string; targetServiceId: string }>) {
    this.adjacency = buildAdjacencyList(edges);
    this.allServiceIds = new Set(this.adjacency.keys());
  }

  analyze(failedServiceIds: string[]): BlastRadiusResult {
    const failedSet = new Set(failedServiceIds);
    const directlyImpacted = new Set<string>();
    const indirectlyImpacted = new Set<string>();
    const impactPaths: Record<string, string[][]> = {};
    const impactDepths: Record<string, number> = {};

    for (const failedId of failedServiceIds) {
      if (!this.allServiceIds.has(failedId) && !this.hasIncomingOrOutgoing(failedId)) {
        continue;
      }
    }

    const queue: Array<{ serviceId: string; depth: number; path: string[] }> = [];

    for (const failedId of failedServiceIds) {
      const dependents = this.adjacency.get(failedId) ?? [];
      for (const dependent of dependents) {
        if (failedSet.has(dependent)) continue;

        queue.push({
          serviceId: dependent,
          depth: 1,
          path: [failedId, dependent],
        });
      }
    }

    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      const { serviceId, depth, path } = current;

      if (failedSet.has(serviceId)) continue;

      if (visited.has(serviceId)) {
        if (impactDepths[serviceId] !== undefined && depth < impactDepths[serviceId]) {
          impactDepths[serviceId] = depth;
        }
        if (!impactPaths[serviceId]) {
          impactPaths[serviceId] = [];
        }
        impactPaths[serviceId].push(path);
        continue;
      }

      visited.add(serviceId);

      if (depth === 1) {
        directlyImpacted.add(serviceId);
      } else {
        indirectlyImpacted.add(serviceId);
      }

      impactDepths[serviceId] = depth;
      impactPaths[serviceId] = [path];

      const nextDependents = this.adjacency.get(serviceId) ?? [];
      for (const next of nextDependents) {
        if (failedSet.has(next) || next === serviceId) continue;
        queue.push({
          serviceId: next,
          depth: depth + 1,
          path: [...path, next],
        });
      }
    }

    for (const id of directlyImpacted) {
      indirectlyImpacted.delete(id);
    }

    const allImpacted = [...directlyImpacted, ...indirectlyImpacted];
    const maxDepth = allImpacted.length > 0 ? Math.max(...Object.values(impactDepths)) : 0;

    return {
      failedServices: failedServiceIds,
      directlyImpacted: [...directlyImpacted],
      indirectlyImpacted: [...indirectlyImpacted],
      allImpacted,
      impactPaths,
      impactDepths,
      totalImpacted: allImpacted.length,
      summary: {
        directCount: directlyImpacted.size,
        indirectCount: indirectlyImpacted.size,
        maxDepth,
      },
    };
  }

  private hasIncomingOrOutgoing(serviceId: string): boolean {
    if (this.adjacency.has(serviceId) && (this.adjacency.get(serviceId)?.length ?? 0) > 0) {
      return true;
    }
    for (const [, dependents] of this.adjacency) {
      if (dependents.includes(serviceId)) return true;
    }
    return false;
  }
}
