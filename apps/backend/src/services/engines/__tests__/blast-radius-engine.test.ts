import { BlastRadiusEngine } from '../blast-radius-engine';

type Edge = { sourceServiceId: string; targetServiceId: string };

function edge(source: string, target: string): Edge {
  return { sourceServiceId: source, targetServiceId: target };
}

describe('BlastRadiusEngine', () => {
  describe('empty and isolated graphs', () => {
    it('returns zero impact for an empty graph', () => {
      const engine = new BlastRadiusEngine([]);

      const result = engine.analyze(['orphan']);

      expect(result.failedServices).toEqual(['orphan']);
      expect(result.directlyImpacted).toEqual([]);
      expect(result.indirectlyImpacted).toEqual([]);
      expect(result.allImpacted).toEqual([]);
      expect(result.totalImpacted).toBe(0);
      expect(result.summary).toEqual({ directCount: 0, indirectCount: 0, maxDepth: 0 });
    });

    it('returns zero impact when the failed service has no dependents', () => {
      const engine = new BlastRadiusEngine([edge('client', 'api')]);

      const result = engine.analyze(['client']);

      expect(result.totalImpacted).toBe(0);
      expect(result.allImpacted).toEqual([]);
    });

    it('ignores unknown failed services that are not connected to the graph', () => {
      const engine = new BlastRadiusEngine([edge('a', 'b')]);

      const result = engine.analyze(['unknown']);

      expect(result.totalImpacted).toBe(0);
    });
  });

  describe('single failure propagation', () => {
    it('marks direct dependents when a leaf dependency fails', () => {
      // client -> api -> database; database failure impacts api then client
      const engine = new BlastRadiusEngine([
        edge('client', 'api'),
        edge('api', 'database'),
      ]);

      const result = engine.analyze(['database']);

      expect(result.directlyImpacted).toEqual(['api']);
      expect(result.indirectlyImpacted).toEqual(['client']);
      expect(result.totalImpacted).toBe(2);
      expect(result.summary.maxDepth).toBe(2);
      expect(result.impactDepths.api).toBe(1);
      expect(result.impactDepths.client).toBe(2);
      expect(result.impactPaths.api[0]).toEqual(['database', 'api']);
      expect(result.impactPaths.client[0]).toEqual(['database', 'api', 'client']);
    });

    it('returns zero impact when a root service with no upstream dependents fails', () => {
      const engine = new BlastRadiusEngine([edge('web', 'auth')]);

      const result = engine.analyze(['web']);

      expect(result.totalImpacted).toBe(0);
    });
  });

  describe('multiple failures', () => {
    it('analyzes overlapping blast radii from multiple failed services', () => {
      const engine = new BlastRadiusEngine([
        edge('checkout', 'payments'),
        edge('checkout', 'inventory'),
        edge('payments', 'stripe'),
        edge('inventory', 'warehouse'),
      ]);

      const result = engine.analyze(['stripe', 'warehouse']);

      expect(result.directlyImpacted.sort()).toEqual(['inventory', 'payments'].sort());
      expect(result.indirectlyImpacted).toEqual(['checkout']);
      expect(result.totalImpacted).toBe(3);
      expect(result.summary.directCount).toBe(2);
      expect(result.summary.indirectCount).toBe(1);
    });

    it('does not count failed services as impacted dependents', () => {
      const engine = new BlastRadiusEngine([
        edge('a', 'b'),
        edge('b', 'c'),
      ]);

      const result = engine.analyze(['b', 'c']);

      expect(result.allImpacted).not.toContain('b');
      expect(result.allImpacted).not.toContain('c');
      expect(result.directlyImpacted).toEqual(['a']);
    });
  });

  describe('disconnected graphs', () => {
    it('limits impact to the connected component of the failure', () => {
      const engine = new BlastRadiusEngine([
        edge('app-a', 'db-a'),
        edge('app-b', 'db-b'),
      ]);

      const result = engine.analyze(['db-a']);

      expect(result.allImpacted).toEqual(['app-a']);
      expect(result.totalImpacted).toBe(1);
    });

    it('handles two isolated chains without cross-contamination', () => {
      const engine = new BlastRadiusEngine([
        edge('x1', 'x2'),
        edge('x2', 'x3'),
        edge('y1', 'y2'),
      ]);

      const result = engine.analyze(['x3']);

      expect(result.directlyImpacted).toEqual(['x2']);
      expect(result.indirectlyImpacted).toEqual(['x1']);
      expect(result.allImpacted).not.toContain('y1');
      expect(result.allImpacted).not.toContain('y2');
    });
  });

  describe('complex topologies', () => {
    it('tracks multiple impact paths to the same service', () => {
      //       checkout
      //       /      \
      //  payments   inventory
      //       \      /
      //         stripe
      const engine = new BlastRadiusEngine([
        edge('checkout', 'payments'),
        edge('checkout', 'inventory'),
        edge('payments', 'stripe'),
        edge('inventory', 'stripe'),
      ]);

      const result = engine.analyze(['stripe']);

      expect(result.directlyImpacted.sort()).toEqual(['inventory', 'payments'].sort());
      expect(result.indirectlyImpacted).toEqual(['checkout']);
      expect(result.impactPaths.checkout.length).toBeGreaterThanOrEqual(1);
    });

    it('propagates through deep dependency chains', () => {
      const engine = new BlastRadiusEngine([
        edge('l1', 'l2'),
        edge('l2', 'l3'),
        edge('l3', 'l4'),
        edge('l4', 'l5'),
      ]);

      const result = engine.analyze(['l5']);

      expect(result.indirectlyImpacted.sort()).toEqual(['l1', 'l2', 'l3'].sort());
      expect(result.directlyImpacted).toEqual(['l4']);
      expect(result.summary.maxDepth).toBe(4);
    });

    it('keeps direct and indirect impact sets disjoint', () => {
      const engine = new BlastRadiusEngine([
        edge('a', 'b'),
        edge('b', 'c'),
      ]);

      const result = engine.analyze(['c']);

      const overlap = result.directlyImpacted.filter((id) =>
        result.indirectlyImpacted.includes(id),
      );
      expect(overlap).toEqual([]);
    });
  });
});
