import { PathExplorerEngine } from '../path-explorer-engine';

type Edge = { sourceServiceId: string; targetServiceId: string };

function edge(source: string, target: string): Edge {
  return { sourceServiceId: source, targetServiceId: target };
}

describe('PathExplorerEngine', () => {
  describe('explore', () => {
    it('returns a trivial path when root and target are the same service', () => {
      const engine = new PathExplorerEngine([edge('a', 'b')]);

      const result = engine.explore('a', 'a');

      expect(result).toEqual({
        rootServiceId: 'a',
        targetServiceId: 'a',
        shortestPath: ['a'],
        longestPath: ['a'],
        allPaths: [['a']],
        traversalDepth: 0,
      });
    });

    it('finds a single direct dependency path', () => {
      const engine = new PathExplorerEngine([edge('web', 'api')]);

      const result = engine.explore('web', 'api');

      expect(result.allPaths).toEqual([['web', 'api']]);
      expect(result.shortestPath).toEqual(['web', 'api']);
      expect(result.longestPath).toEqual(['web', 'api']);
      expect(result.traversalDepth).toBe(1);
    });

    it('finds the shortest and longest paths in a diamond graph', () => {
      const engine = new PathExplorerEngine([
        edge('checkout', 'payments'),
        edge('checkout', 'inventory'),
        edge('payments', 'stripe'),
        edge('inventory', 'stripe'),
      ]);

      const result = engine.explore('checkout', 'stripe');

      expect(result.allPaths).toHaveLength(2);
      expect(result.allPaths).toEqual(
        expect.arrayContaining([
          ['checkout', 'payments', 'stripe'],
          ['checkout', 'inventory', 'stripe'],
        ]),
      );
      expect(result.shortestPath?.length).toBe(3);
      expect(result.longestPath?.length).toBe(3);
      expect(result.traversalDepth).toBe(2);
    });

    it('prefers the shortest path when routes differ in length', () => {
      const engine = new PathExplorerEngine([
        edge('app', 'cache'),
        edge('app', 'gateway'),
        edge('gateway', 'auth'),
        edge('auth', 'cache'),
      ]);

      const result = engine.explore('app', 'cache');

      expect(result.shortestPath).toEqual(['app', 'cache']);
      expect(result.longestPath).toEqual(['app', 'gateway', 'auth', 'cache']);
      expect(result.allPaths.length).toBeGreaterThanOrEqual(2);
      expect(result.traversalDepth).toBe(3);
    });

    it('returns empty paths when no dependency route exists', () => {
      const engine = new PathExplorerEngine([
        edge('a', 'b'),
        edge('c', 'd'),
      ]);

      const result = engine.explore('a', 'd');

      expect(result.allPaths).toEqual([]);
      expect(result.shortestPath).toBeNull();
      expect(result.longestPath).toBeNull();
      expect(result.traversalDepth).toBe(0);
    });

    it('handles an empty graph with no paths between distinct services', () => {
      const engine = new PathExplorerEngine([]);

      const result = engine.explore('solo', 'missing');

      expect(result.allPaths).toEqual([]);
      expect(result.shortestPath).toBeNull();
      expect(result.longestPath).toBeNull();
      expect(result.traversalDepth).toBe(0);
    });

    it('avoids revisiting nodes to prevent infinite loops in cyclic graphs', () => {
      const engine = new PathExplorerEngine([
        edge('a', 'b'),
        edge('b', 'c'),
        edge('c', 'a'),
      ]);

      const result = engine.explore('a', 'c');

      expect(result.allPaths.length).toBeGreaterThanOrEqual(1);
      expect(result.allPaths.every((path) => path[0] === 'a' && path[path.length - 1] === 'c')).toBe(
        true,
      );
    });

    it('explores deep linear dependency chains', () => {
      const engine = new PathExplorerEngine([
        edge('l1', 'l2'),
        edge('l2', 'l3'),
        edge('l3', 'l4'),
        edge('l4', 'l5'),
      ]);

      const result = engine.explore('l1', 'l5');

      expect(result.shortestPath).toEqual(['l1', 'l2', 'l3', 'l4', 'l5']);
      expect(result.longestPath).toEqual(['l1', 'l2', 'l3', 'l4', 'l5']);
      expect(result.traversalDepth).toBe(4);
    });
  });

  describe('calculateMaxDepth', () => {
    it('returns zero for an empty service list', () => {
      const engine = new PathExplorerEngine([edge('a', 'b')]);

      expect(engine.calculateMaxDepth([])).toBe(0);
    });

    it('returns zero for services with no dependencies', () => {
      const engine = new PathExplorerEngine([]);

      expect(engine.calculateMaxDepth(['leaf'])).toBe(0);
    });

    it('computes maximum dependency depth across services', () => {
      const engine = new PathExplorerEngine([
        edge('app', 'api'),
        edge('api', 'db'),
        edge('worker', 'queue'),
      ]);

      expect(engine.calculateMaxDepth(['app', 'worker'])).toBe(2);
    });

    it('handles cyclic graphs without infinite recursion', () => {
      const engine = new PathExplorerEngine([
        edge('a', 'b'),
        edge('b', 'c'),
        edge('c', 'a'),
      ]);

      expect(engine.calculateMaxDepth(['a', 'b', 'c'])).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateAverageDepth', () => {
    it('returns zero for an empty service list', () => {
      const engine = new PathExplorerEngine([edge('a', 'b')]);

      expect(engine.calculateAverageDepth([])).toBe(0);
    });

    it('averages dependency depth across services', () => {
      const engine = new PathExplorerEngine([
        edge('frontend', 'api'),
        edge('api', 'database'),
        edge('worker', 'queue'),
      ]);

      const average = engine.calculateAverageDepth(['frontend', 'worker']);

      expect(average).toBe(1.5);
    });

    it('returns zero when no dependencies exist', () => {
      const engine = new PathExplorerEngine([]);

      expect(engine.calculateAverageDepth(['solo-a', 'solo-b'])).toBe(0);
    });
  });
});
