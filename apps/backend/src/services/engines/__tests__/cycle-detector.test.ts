import { CycleDetector } from '../cycle-detector';

type Edge = { sourceServiceId: string; targetServiceId: string };

function edge(source: string, target: string): Edge {
  return { sourceServiceId: source, targetServiceId: target };
}

describe('CycleDetector', () => {
  describe('wouldCreateCycle', () => {
    it('detects a direct self-dependency cycle', () => {
      const detector = new CycleDetector([]);

      const result = detector.wouldCreateCycle('svc-a', 'svc-a');

      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toEqual(['svc-a', 'svc-a']);
      expect(result.cycleServices).toEqual(['svc-a', 'svc-a']);
    });

    it('maps service names for self-dependency cycles', () => {
      const names = new Map([['svc-a', 'Service A']]);
      const detector = new CycleDetector([], names);

      const result = detector.wouldCreateCycle('svc-a', 'svc-a');

      expect(result.cycleServices).toEqual(['Service A', 'Service A']);
    });

    it('returns no cycle for a safe edge on an acyclic graph', () => {
      const detector = new CycleDetector([edge('a', 'b'), edge('b', 'c')]);

      const result = detector.wouldCreateCycle('a', 'c');

      expect(result).toEqual({ hasCycle: false });
    });

    it('detects an indirect cycle when the new edge closes a loop', () => {
      // a -> b -> c; adding c -> a creates a -> b -> c -> a
      const detector = new CycleDetector([edge('a', 'b'), edge('b', 'c')]);

      const result = detector.wouldCreateCycle('c', 'a');

      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toEqual(['a', 'b', 'c', 'a']);
    });

    it('detects a deep cycle across many hops', () => {
      const detector = new CycleDetector([
        edge('n1', 'n2'),
        edge('n2', 'n3'),
        edge('n3', 'n4'),
        edge('n4', 'n5'),
        edge('n5', 'n6'),
      ]);

      const result = detector.wouldCreateCycle('n6', 'n1');

      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toEqual(['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n1']);
    });

    it('allows edges that do not introduce cycles in a DAG', () => {
      const detector = new CycleDetector([
        edge('frontend', 'api'),
        edge('api', 'database'),
        edge('worker', 'database'),
      ]);

      const result = detector.wouldCreateCycle('frontend', 'database');

      expect(result).toEqual({ hasCycle: false });
    });

    it('handles empty graphs when adding the first edge', () => {
      const detector = new CycleDetector([]);

      const result = detector.wouldCreateCycle('x', 'y');

      expect(result).toEqual({ hasCycle: false });
    });
  });

  describe('detectAllCycles', () => {
    it('returns an empty array for an empty graph', () => {
      const detector = new CycleDetector([]);

      expect(detector.detectAllCycles()).toEqual([]);
    });

    it('returns an empty array for an acyclic graph', () => {
      const detector = new CycleDetector([
        edge('ingress', 'gateway'),
        edge('gateway', 'auth'),
        edge('gateway', 'catalog'),
        edge('catalog', 'database'),
      ]);

      expect(detector.detectAllCycles()).toEqual([]);
    });

    it('detects a direct two-node cycle in the existing graph', () => {
      const detector = new CycleDetector([edge('a', 'b'), edge('b', 'a')]);

      const cycles = detector.detectAllCycles();

      expect(cycles).toHaveLength(1);
      expect(cycles[0].hasCycle).toBe(true);
      expect(cycles[0].cyclePath).toEqual(['a', 'b', 'a']);
    });

    it('detects an indirect cycle in the existing graph', () => {
      const detector = new CycleDetector([
        edge('payments', 'ledger'),
        edge('ledger', 'accounts'),
        edge('accounts', 'payments'),
      ]);

      const cycles = detector.detectAllCycles();

      expect(cycles).toHaveLength(1);
      expect(cycles[0].cyclePath).toEqual(['payments', 'ledger', 'accounts', 'payments']);
    });

    it('detects a deep cycle in the existing graph', () => {
      const detector = new CycleDetector([
        edge('s1', 's2'),
        edge('s2', 's3'),
        edge('s3', 's4'),
        edge('s4', 's5'),
        edge('s5', 's1'),
      ]);

      const cycles = detector.detectAllCycles();

      expect(cycles).toHaveLength(1);
      expect(cycles[0].cyclePath).toEqual(['s1', 's2', 's3', 's4', 's5', 's1']);
    });

    it('includes human-readable service names in cycle results', () => {
      const names = new Map([
        ['a', 'Alpha'],
        ['b', 'Beta'],
        ['c', 'Gamma'],
      ]);
      const detector = new CycleDetector([edge('a', 'b'), edge('b', 'c'), edge('c', 'a')], names);

      const cycles = detector.detectAllCycles();

      expect(cycles[0].cycleServices).toEqual(['Alpha', 'Beta', 'Gamma', 'Alpha']);
    });

    it('finds at least one cycle when multiple disjoint cycles exist', () => {
      const detector = new CycleDetector([
        edge('a', 'b'),
        edge('b', 'a'),
        edge('c', 'd'),
        edge('d', 'c'),
      ]);

      const cycles = detector.detectAllCycles();

      expect(cycles.length).toBeGreaterThanOrEqual(1);
      expect(cycles.every((c) => c.hasCycle)).toBe(true);
    });
  });
});
