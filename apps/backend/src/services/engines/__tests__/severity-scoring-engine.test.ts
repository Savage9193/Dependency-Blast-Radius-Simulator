import {
  CRITICALITY_WEIGHTS,
  Criticality,
  SeverityClassification,
  SEVERITY_THRESHOLDS,
  type BlastRadiusResult,
} from '@dbrs/shared';
import { SeverityScoringEngine } from '../severity-scoring-engine';

function buildBlastRadius(overrides: Partial<BlastRadiusResult> = {}): BlastRadiusResult {
  return {
    failedServices: ['root'],
    directlyImpacted: [],
    indirectlyImpacted: [],
    allImpacted: [],
    impactPaths: {},
    impactDepths: {},
    totalImpacted: 0,
    summary: { directCount: 0, indirectCount: 0, maxDepth: 0 },
    ...overrides,
  };
}

describe('SeverityScoringEngine', () => {
  const engine = new SeverityScoringEngine();

  describe('minimum and zero-impact scenarios', () => {
    it('scores low for no impacted services and minimal depth', () => {
      const result = engine.calculate(buildBlastRadius(), new Map(), 10, 5);

      expect(result.score).toBe(3);
      expect(result.classification).toBe(SeverityClassification.LOW);
      expect(result.breakdown.affectedScore).toBe(0);
      expect(result.breakdown.depthScore).toBe(0);
      expect(result.breakdown.criticalityScore).toBeGreaterThan(0);
      expect(result.breakdown.rootScore).toBe(2);
    });

    it('uses single criticality weight as denominator when totalServices is zero', () => {
      const blast = buildBlastRadius({
        failedServices: ['a'],
        directlyImpacted: ['b'],
        indirectlyImpacted: [],
        allImpacted: ['b'],
        totalImpacted: 1,
        summary: { directCount: 1, indirectCount: 0, maxDepth: 1 },
      });

      const result = engine.calculate(blast, new Map([['a', Criticality.CRITICAL], ['b', Criticality.CRITICAL]]), 0, 1);

      expect(result.breakdown.affectedScore).toBe(0);
      expect(result.breakdown.criticalityScore).toBe(30);
    });
  });

  describe('affectedScore (max 40)', () => {
    it('scales affected score proportionally to impacted services', () => {
      const blast = buildBlastRadius({
        failedServices: ['f1'],
        directlyImpacted: ['d1', 'd2'],
        allImpacted: ['d1', 'd2'],
        totalImpacted: 2,
        summary: { directCount: 2, indirectCount: 0, maxDepth: 1 },
      });

      const result = engine.calculate(blast, new Map(), 10, 5);

      expect(result.breakdown.affectedScore).toBe(8);
    });

    it('caps affected score at 40 when all services are impacted', () => {
      const impacted = ['s1', 's2', 's3', 's4'];
      const blast = buildBlastRadius({
        failedServices: ['s5'],
        directlyImpacted: impacted,
        allImpacted: impacted,
        totalImpacted: 4,
        summary: { directCount: 4, indirectCount: 0, maxDepth: 1 },
      });

      const result = engine.calculate(blast, new Map(), 4, 3);

      expect(result.breakdown.affectedScore).toBe(40);
    });
  });

  describe('depthScore (max 20)', () => {
    it('scales depth score relative to max graph depth', () => {
      const blast = buildBlastRadius({
        failedServices: ['leaf'],
        directlyImpacted: ['mid'],
        indirectlyImpacted: ['root'],
        allImpacted: ['mid', 'root'],
        totalImpacted: 2,
        summary: { directCount: 1, indirectCount: 1, maxDepth: 2 },
      });

      const result = engine.calculate(blast, new Map(), 10, 4);

      expect(result.breakdown.depthScore).toBe(10);
    });

    it('caps depth score at 20 when max depth equals graph depth', () => {
      const blast = buildBlastRadius({
        failedServices: ['a'],
        directlyImpacted: ['b'],
        allImpacted: ['b'],
        totalImpacted: 1,
        summary: { directCount: 1, indirectCount: 0, maxDepth: 5 },
      });

      const result = engine.calculate(blast, new Map(), 10, 5);

      expect(result.breakdown.depthScore).toBe(20);
    });

    it('uses a minimum effective graph depth of 1', () => {
      const blast = buildBlastRadius({
        summary: { directCount: 0, indirectCount: 0, maxDepth: 0 },
      });

      const result = engine.calculate(blast, new Map(), 10, 0);

      expect(result.breakdown.depthScore).toBe(0);
    });
  });

  describe('criticalityScore (max 30)', () => {
    it('weights impacted and failed services by criticality', () => {
      const blast = buildBlastRadius({
        failedServices: ['f1'],
        directlyImpacted: ['d1'],
        allImpacted: ['d1'],
        totalImpacted: 1,
        summary: { directCount: 1, indirectCount: 0, maxDepth: 1 },
      });
      const criticalities = new Map<string, Criticality>([
        ['f1', Criticality.CRITICAL],
        ['d1', Criticality.CRITICAL],
      ]);

      const result = engine.calculate(blast, criticalities, 2, 1);

      const expectedWeight = CRITICALITY_WEIGHTS[Criticality.CRITICAL] * 2;
      const maxWeight = 2 * CRITICALITY_WEIGHTS[Criticality.CRITICAL];
      expect(result.breakdown.criticalityScore).toBe((expectedWeight / maxWeight) * 30);
    });

    it('defaults missing criticality entries to MEDIUM', () => {
      const blast = buildBlastRadius({
        failedServices: ['f1'],
        directlyImpacted: ['d1'],
        allImpacted: ['d1'],
        totalImpacted: 1,
        summary: { directCount: 1, indirectCount: 0, maxDepth: 1 },
      });

      const result = engine.calculate(blast, new Map(), 2, 1);

      const expectedWeight = CRITICALITY_WEIGHTS[Criticality.MEDIUM] * 2;
      const maxWeight = 2 * CRITICALITY_WEIGHTS[Criticality.CRITICAL];
      expect(result.breakdown.criticalityScore).toBeCloseTo((expectedWeight / maxWeight) * 30, 2);
    });

    it('caps criticality score at 30', () => {
      const services = ['s1', 's2', 's3'];
      const criticalities = new Map(services.map((id) => [id, Criticality.CRITICAL]));
      const blast = buildBlastRadius({
        failedServices: services,
        directlyImpacted: services,
        allImpacted: services,
        totalImpacted: 3,
        summary: { directCount: 3, indirectCount: 0, maxDepth: 1 },
      });

      const result = engine.calculate(blast, criticalities, 3, 1);

      expect(result.breakdown.criticalityScore).toBe(30);
    });
  });

  describe('rootScore (max 10)', () => {
    it('increases root score with failed service count up to five', () => {
      const blastThree = buildBlastRadius({
        failedServices: ['a', 'b', 'c'],
      });
      const blastFive = buildBlastRadius({
        failedServices: ['a', 'b', 'c', 'd', 'e'],
      });

      const threeResult = engine.calculate(blastThree, new Map(), 10, 5);
      const fiveResult = engine.calculate(blastFive, new Map(), 10, 5);

      expect(threeResult.breakdown.rootScore).toBe(6);
      expect(fiveResult.breakdown.rootScore).toBe(10);
    });

    it('does not exceed root score cap beyond five failed roots', () => {
      const blast = buildBlastRadius({
        failedServices: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      });

      const result = engine.calculate(blast, new Map(), 20, 5);

      expect(result.breakdown.rootScore).toBe(10);
    });
  });

  describe('classification boundaries', () => {
    it('classifies scores at or below 25 as LOW', () => {
      const blast = buildBlastRadius({
        failedServices: ['a'],
        summary: { directCount: 0, indirectCount: 0, maxDepth: 0 },
      });

      const result = engine.calculate(blast, new Map([['a', Criticality.LOW]]), 100, 10);

      expect(result.score).toBeLessThanOrEqual(SEVERITY_THRESHOLDS.LOW);
      expect(result.classification).toBe(SeverityClassification.LOW);
    });

    it('classifies scores between 26 and 50 as MEDIUM', () => {
      const impacted = ['c1', 'c2', 'c3', 'c4', 'c5'];
      const blast = buildBlastRadius({
        failedServices: ['a', 'b', 'c'],
        directlyImpacted: impacted,
        allImpacted: impacted,
        totalImpacted: 5,
        summary: { directCount: 5, indirectCount: 0, maxDepth: 2 },
      });
      const criticalities = new Map<string, Criticality>(
        ['a', 'b', 'c', ...impacted].map((id) => [id, Criticality.MEDIUM]),
      );

      const result = engine.calculate(blast, criticalities, 10, 5);

      expect(result.score).toBeGreaterThan(SEVERITY_THRESHOLDS.LOW);
      expect(result.score).toBeLessThanOrEqual(SEVERITY_THRESHOLDS.MEDIUM);
      expect(result.classification).toBe(SeverityClassification.MEDIUM);
    });

    it('classifies scores between 51 and 75 as HIGH', () => {
      const impacted = ['s1', 's2', 's3', 's4', 's5', 's6'];
      const blast = buildBlastRadius({
        failedServices: ['root1', 'root2', 'root3', 'root4'],
        directlyImpacted: impacted,
        indirectlyImpacted: [],
        allImpacted: impacted,
        totalImpacted: 6,
        summary: { directCount: 6, indirectCount: 0, maxDepth: 3 },
      });
      const criticalities = new Map<string, Criticality>(
        [...blast.failedServices, ...impacted].map((id) => [id, Criticality.HIGH]),
      );

      const result = engine.calculate(blast, criticalities, 10, 5);

      expect(result.score).toBeGreaterThan(SEVERITY_THRESHOLDS.MEDIUM);
      expect(result.score).toBeLessThanOrEqual(SEVERITY_THRESHOLDS.HIGH);
      expect(result.classification).toBe(SeverityClassification.HIGH);
    });

    it('classifies scores above 75 as CRITICAL', () => {
      const impacted = Array.from({ length: 9 }, (_, i) => `svc-${i}`);
      const blast = buildBlastRadius({
        failedServices: ['f1', 'f2', 'f3', 'f4', 'f5'],
        directlyImpacted: impacted,
        allImpacted: impacted,
        totalImpacted: 9,
        summary: { directCount: 9, indirectCount: 0, maxDepth: 5 },
      });
      const criticalities = new Map<string, Criticality>(
        [...blast.failedServices, ...impacted].map((id) => [id, Criticality.CRITICAL]),
      );

      const result = engine.calculate(blast, criticalities, 10, 5);

      expect(result.score).toBeGreaterThan(SEVERITY_THRESHOLDS.HIGH);
      expect(result.classification).toBe(SeverityClassification.CRITICAL);
    });
  });

  describe('score clamping', () => {
    it('clamps the final score between 0 and 100', () => {
      const blast = buildBlastRadius({
        failedServices: ['a', 'b', 'c', 'd', 'e'],
        directlyImpacted: ['x'],
        allImpacted: ['x'],
        totalImpacted: 1,
        summary: { directCount: 1, indirectCount: 0, maxDepth: 1 },
      });

      const result = engine.calculate(blast, new Map([['a', Criticality.LOW]]), 1, 1);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('rounds the final score to an integer', () => {
      const blast = buildBlastRadius({
        failedServices: ['a'],
        directlyImpacted: ['b'],
        allImpacted: ['b'],
        totalImpacted: 1,
        summary: { directCount: 1, indirectCount: 0, maxDepth: 1 },
      });

      const result = engine.calculate(blast, new Map(), 3, 2);

      expect(Number.isInteger(result.score)).toBe(true);
    });
  });
});
