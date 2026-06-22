import type { HealthDashboard, AnalyticsTrends } from '@dbrs/shared';
import { Criticality } from '@dbrs/shared';
import {
  ServiceRepository,
  DependencyRepository,
  SimulationRepository,
  SimulationResultRepository,
} from '../db/repositories';
import { PathExplorerEngine } from './engines/path-explorer-engine';
import { SimulationService } from './simulation.service';

export class HealthService {
  constructor(
    private serviceRepo = new ServiceRepository(),
    private dependencyRepo = new DependencyRepository(),
    private simulationRepo = new SimulationRepository(),
    private simulationService = new SimulationService(),
  ) {}

  async getDashboard(): Promise<HealthDashboard> {
    const [statusCounts, criticalityCounts, totalServices, totalDeps, mostConnected, simCount, recentSims, allServices, allDeps] =
      await Promise.all([
        this.serviceRepo.countByStatus(),
        this.serviceRepo.countByCriticality(),
        this.serviceRepo.count(),
        this.dependencyRepo.count(),
        this.dependencyRepo.getMostConnected(5),
        this.simulationRepo.count(),
        this.simulationRepo.findAll(5, 0),
        this.serviceRepo.findAllIds(),
        this.dependencyRepo.findAll(),
      ]);

    const explorer = new PathExplorerEngine(allDeps);
    const avgDepth = explorer.calculateAverageDepth(allServices.map((s) => s.id));

    const serviceMap = new Map(allServices.map((s) => [s.id, s.name]));

    return {
      totalServices,
      healthyServices: statusCounts['HEALTHY'] ?? 0,
      degradedServices: statusCounts['DEGRADED'] ?? 0,
      failedServices: statusCounts['FAILED'] ?? 0,
      totalDependencies: totalDeps,
      averageDependencyDepth: avgDepth,
      criticalServices: criticalityCounts[Criticality.CRITICAL] ?? 0,
      mostConnectedServices: mostConnected.map(([id, count]) => ({
        id,
        name: serviceMap.get(id) ?? id,
        connectionCount: count,
      })),
      simulationsCount: simCount,
      recentSimulations: recentSims.map((s) => this.simulationService.toSimulation(s)),
    };
  }
}

export class AnalyticsService {
  constructor(
    private simulationRepo = new SimulationRepository(),
    private resultRepo = new SimulationResultRepository(),
    private serviceRepo = new ServiceRepository(),
    private dependencyRepo = new DependencyRepository(),
  ) {}

  async getTrends(days = 30): Promise<AnalyticsTrends> {
    const [trends, mostImpacted, criticalityCounts, allServices, allDeps] = await Promise.all([
      this.simulationRepo.getTrends(days),
      this.resultRepo.getMostImpacted(10),
      this.serviceRepo.countByCriticality(),
      this.serviceRepo.findAllIds(),
      this.dependencyRepo.findAll(),
    ]);

    const serviceMap = new Map(allServices.map((s) => [s.id, s.name]));
    const explorer = new PathExplorerEngine(allDeps);

    const depthCounts = new Map<number, number>();
    for (const service of allServices) {
      const depth = explorer.calculateMaxDepth([service.id]);
      depthCounts.set(depth, (depthCounts.get(depth) ?? 0) + 1);
    }

    return {
      blastRadiusTrend: trends.map((t) => ({
        date: t.date,
        totalImpacted: Math.round(Number(t.avgImpacted) || 0),
      })),
      severityTrend: trends.map((t) => ({
        date: t.date,
        severityScore: Math.round(Number(t.avgSeverity) || 0),
      })),
      mostImpactedServices: mostImpacted.map((m) => ({
        serviceId: m.serviceId,
        serviceName: serviceMap.get(m.serviceId) ?? m.serviceId,
        impactCount: m.impactCount,
      })),
      criticalityDistribution: Object.entries(criticalityCounts).map(([criticality, count]) => ({
        criticality: criticality as Criticality,
        count,
      })),
      dependencyDepthDistribution: [...depthCounts.entries()].map(([depth, count]) => ({
        depth,
        count,
      })),
      simulationTrend: trends.map((t) => ({
        date: t.date,
        count: t.count,
      })),
    };
  }
}
