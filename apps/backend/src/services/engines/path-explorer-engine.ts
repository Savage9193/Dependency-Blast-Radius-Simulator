import type { PathExplorerResult } from '@dbrs/shared';
import { buildReverseAdjacencyList } from '../../utils/mappers';

/**
 * Explores all dependency paths from root to target service.
 * Edge: source depends on target, so path goes target -> ... -> source direction for dependencies
 * For path from root to affected: traverse reverse adjacency (dependencies chain)
 */
export class PathExplorerEngine {
  private reverseAdjacency: Map<string, string[]>;

  constructor(edges: Array<{ sourceServiceId: string; targetServiceId: string }>) {
    this.reverseAdjacency = buildReverseAdjacencyList(edges);
  }

  explore(rootServiceId: string, targetServiceId: string): PathExplorerResult {
    if (rootServiceId === targetServiceId) {
      return {
        rootServiceId,
        targetServiceId,
        shortestPath: [rootServiceId],
        longestPath: [rootServiceId],
        allPaths: [[rootServiceId]],
        traversalDepth: 0,
      };
    }

    const allPaths: string[][] = [];
    const visited = new Set<string>();

    const dfs = (current: string, path: string[]): void => {
      if (current === targetServiceId) {
        allPaths.push([...path]);
        return;
      }

      visited.add(current);
      const dependencies = this.reverseAdjacency.get(current) ?? [];

      for (const dep of dependencies) {
        if (path.includes(dep)) continue;
        dfs(dep, [...path, dep]);
      }
      visited.delete(current);
    };

    dfs(rootServiceId, [rootServiceId]);

    let shortestPath: string[] | null = null;
    let longestPath: string[] | null = null;

    if (allPaths.length > 0) {
      shortestPath = allPaths.reduce((a, b) => (a.length <= b.length ? a : b));
      longestPath = allPaths.reduce((a, b) => (a.length >= b.length ? a : b));
    }

    const traversalDepth = longestPath ? longestPath.length - 1 : 0;

    return {
      rootServiceId,
      targetServiceId,
      shortestPath,
      longestPath,
      allPaths,
      traversalDepth,
    };
  }

  calculateMaxDepth(serviceIds: string[]): number {
    let maxDepth = 0;
    const memo = new Map<string, number>();

    const getDepth = (nodeId: string, visiting: Set<string>): number => {
      if (memo.has(nodeId)) return memo.get(nodeId)!;
      if (visiting.has(nodeId)) return 0;

      visiting.add(nodeId);
      const deps = this.reverseAdjacency.get(nodeId) ?? [];
      let depth = 0;
      for (const dep of deps) {
        depth = Math.max(depth, 1 + getDepth(dep, visiting));
      }
      visiting.delete(nodeId);
      memo.set(nodeId, depth);
      return depth;
    };

    for (const id of serviceIds) {
      maxDepth = Math.max(maxDepth, getDepth(id, new Set()));
    }

    return maxDepth;
  }

  calculateAverageDepth(serviceIds: string[]): number {
    if (serviceIds.length === 0) return 0;
    let totalDepth = 0;
    const memo = new Map<string, number>();

    const getDepth = (nodeId: string, visiting: Set<string>): number => {
      if (memo.has(nodeId)) return memo.get(nodeId)!;
      if (visiting.has(nodeId)) return 0;

      visiting.add(nodeId);
      const deps = this.reverseAdjacency.get(nodeId) ?? [];
      if (deps.length === 0) {
        visiting.delete(nodeId);
        memo.set(nodeId, 0);
        return 0;
      }
      let maxChildDepth = 0;
      for (const dep of deps) {
        maxChildDepth = Math.max(maxChildDepth, 1 + getDepth(dep, visiting));
      }
      visiting.delete(nodeId);
      memo.set(nodeId, maxChildDepth);
      return maxChildDepth;
    };

    for (const id of serviceIds) {
      totalDepth += getDepth(id, new Set());
    }

    return Math.round((totalDepth / serviceIds.length) * 100) / 100;
  }
}
