import {
  CRITICALITY_WEIGHTS,
  SEVERITY_THRESHOLDS,
  SeverityClassification,
  Criticality,
  type SeverityResult,
} from '@dbrs/shared';
import type { BlastRadiusResult } from '@dbrs/shared';

/**
 * Severity Scoring Formula (0-100):
 *
 * affectedScore   = (impactedCount / totalServices) * 40          [max 40]
 * depthScore      = (maxDepth / maxPossibleDepth) * 20            [max 20]
 * criticalityScore = (weightedCriticalitySum / maxPossibleWeight) * 30  [max 30]
 * rootScore       = min(failedRootCount / 5, 1) * 10              [max 10]
 *
 * Classification:
 *   0-25  = LOW
 *   26-50 = MEDIUM
 *   51-75 = HIGH
 *   76-100 = CRITICAL
 */
export class SeverityScoringEngine {
  calculate(
    blastRadius: BlastRadiusResult,
    serviceCriticalities: Map<string, Criticality>,
    totalServices: number,
    maxGraphDepth: number,
  ): SeverityResult {
    const impactedCount = blastRadius.totalImpacted;
    const failedCount = blastRadius.failedServices.length;
    const maxDepth = blastRadius.summary.maxDepth;

    const affectedScore =
      totalServices > 0 ? Math.min((impactedCount / totalServices) * 40, 40) : 0;

    const effectiveMaxDepth = Math.max(maxGraphDepth, 1);
    const depthScore = Math.min((maxDepth / effectiveMaxDepth) * 20, 20);

    let weightedSum = 0;
    const allImpacted = [...blastRadius.directlyImpacted, ...blastRadius.indirectlyImpacted];
    for (const serviceId of allImpacted) {
      const criticality = serviceCriticalities.get(serviceId) ?? Criticality.MEDIUM;
      weightedSum += CRITICALITY_WEIGHTS[criticality];
    }
    for (const failedId of blastRadius.failedServices) {
      const criticality = serviceCriticalities.get(failedId) ?? Criticality.MEDIUM;
      weightedSum += CRITICALITY_WEIGHTS[criticality];
    }

    const maxPossibleWeight =
      totalServices > 0
        ? totalServices * CRITICALITY_WEIGHTS[Criticality.CRITICAL]
        : CRITICALITY_WEIGHTS[Criticality.CRITICAL];
    const criticalityScore =
      maxPossibleWeight > 0 ? Math.min((weightedSum / maxPossibleWeight) * 30, 30) : 0;

    const rootScore = Math.min(failedCount / 5, 1) * 10;

    const rawScore = affectedScore + depthScore + criticalityScore + rootScore;
    const score = Math.round(Math.min(Math.max(rawScore, 0), 100));

    let classification: SeverityClassification;
    if (score <= SEVERITY_THRESHOLDS.LOW) {
      classification = SeverityClassification.LOW;
    } else if (score <= SEVERITY_THRESHOLDS.MEDIUM) {
      classification = SeverityClassification.MEDIUM;
    } else if (score <= SEVERITY_THRESHOLDS.HIGH) {
      classification = SeverityClassification.HIGH;
    } else {
      classification = SeverityClassification.CRITICAL;
    }

    return {
      score,
      classification,
      breakdown: {
        affectedScore: Math.round(affectedScore * 100) / 100,
        depthScore: Math.round(depthScore * 100) / 100,
        criticalityScore: Math.round(criticalityScore * 100) / 100,
        rootScore: Math.round(rootScore * 100) / 100,
      },
    };
  }
}
