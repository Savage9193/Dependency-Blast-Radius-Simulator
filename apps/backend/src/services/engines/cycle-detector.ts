import type { CycleDetectionResult } from '@dbrs/shared';

/**
 * Detects cycles in a directed graph using optimized DFS with recursion stack.
 * Returns the exact cycle path when a cycle would be created.
 */
export class CycleDetector {
  private adjacency: Map<string, string[]>;
  private serviceNames: Map<string, string>;

  constructor(
    edges: Array<{ sourceServiceId: string; targetServiceId: string }>,
    serviceNames: Map<string, string> = new Map(),
  ) {
    this.adjacency = new Map();
    this.serviceNames = serviceNames;

    for (const edge of edges) {
      const targets = this.adjacency.get(edge.sourceServiceId) ?? [];
      targets.push(edge.targetServiceId);
      this.adjacency.set(edge.sourceServiceId, targets);

      if (!this.adjacency.has(edge.targetServiceId)) {
        this.adjacency.set(edge.targetServiceId, []);
      }
    }
  }

  wouldCreateCycle(sourceId: string, targetId: string): CycleDetectionResult {
    if (sourceId === targetId) {
      const name = this.serviceNames.get(sourceId) ?? sourceId;
      return {
        hasCycle: true,
        cyclePath: [sourceId, sourceId],
        cycleServices: [name, name],
      };
    }

    const tempAdjacency = new Map<string, string[]>();
    for (const [key, value] of this.adjacency) {
      tempAdjacency.set(key, [...value]);
    }

    const targets = tempAdjacency.get(sourceId) ?? [];
    targets.push(targetId);
    tempAdjacency.set(sourceId, targets);
    if (!tempAdjacency.has(targetId)) {
      tempAdjacency.set(targetId, []);
    }

    return this.detectCycleFromGraph(tempAdjacency);
  }

  detectAllCycles(): CycleDetectionResult[] {
    const cycles: CycleDetectionResult[] = [];
    const visited = new Set<string>();
    const allNodes = new Set(this.adjacency.keys());

    for (const node of allNodes) {
      if (!visited.has(node)) {
        const cycle = this.findCycleFromNode(node, visited);
        if (cycle.hasCycle && cycle.cyclePath) {
          cycles.push(cycle);
        }
      }
    }

    return cycles;
  }

  private detectCycleFromGraph(adjacency: Map<string, string[]>): CycleDetectionResult {
    const visited = new Set<string>();
    const allNodes = new Set(adjacency.keys());

    for (const node of allNodes) {
      if (!visited.has(node)) {
        const result = this.dfsCycle(node, adjacency, visited, new Set(), []);
        if (result.hasCycle) {
          return result;
        }
      }
    }

    return { hasCycle: false };
  }

  private findCycleFromNode(startNode: string, globalVisited: Set<string>): CycleDetectionResult {
    return this.dfsCycle(startNode, this.adjacency, globalVisited, new Set(), []);
  }

  private dfsCycle(
    node: string,
    adjacency: Map<string, string[]>,
    visited: Set<string>,
    recStack: Set<string>,
    path: string[],
  ): CycleDetectionResult {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const neighbors = adjacency.get(node) ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const result = this.dfsCycle(neighbor, adjacency, visited, recStack, [...path]);
        if (result.hasCycle) {
          return result;
        }
      } else if (recStack.has(neighbor)) {
        const cycleStartIndex = path.indexOf(neighbor);
        const cyclePath = path.slice(cycleStartIndex);
        cyclePath.push(neighbor);
        return {
          hasCycle: true,
          cyclePath,
          cycleServices: cyclePath.map((id) => this.serviceNames.get(id) ?? id),
        };
      }
    }

    recStack.delete(node);
    return { hasCycle: false };
  }
}
