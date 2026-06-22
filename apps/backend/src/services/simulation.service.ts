import type {
  CreateSimulationInput,
  Simulation,
  SimulationResult,
  SimulationComparison,
  SimulationMetadata,
} from '@dbrs/shared';
import { ImpactType, AuditAction, AuditEntityType, Criticality } from '@dbrs/shared';
import {
  ServiceRepository,
  DependencyRepository,
  SimulationRepository,
  SimulationResultRepository,
  AuditLogRepository,
} from '../db/repositories';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { BlastRadiusEngine } from './engines/blast-radius-engine';
import { SeverityScoringEngine } from './engines/severity-scoring-engine';
import { PathExplorerEngine } from './engines/path-explorer-engine';
import { DependencyService } from './dependency.service';
import { appEvents } from '../events/app-events';

export class SimulationService {
  constructor(
    private simulationRepo = new SimulationRepository(),
    private resultRepo = new SimulationResultRepository(),
    private serviceRepo = new ServiceRepository(),
    private dependencyRepo = new DependencyRepository(),
    private auditRepo = new AuditLogRepository(),
    private dependencyService = new DependencyService(),
  ) {}

  async runSimulation(input: CreateSimulationInput) {
    const { name, failedServiceIds } = input;

    appEvents.emitSimulationStarted({ name, failedServiceIds });

    const services = await this.serviceRepo.findByIds(failedServiceIds);
    if (services.length !== failedServiceIds.length) {
      throw new BadRequestError('One or more failed service IDs are invalid');
    }

    const allDeps = await this.dependencyRepo.findAll();
    const allServices = await this.serviceRepo.findAllIds();
    const graphSnapshot = await this.dependencyService.getGraph();

    const blastEngine = new BlastRadiusEngine(allDeps);
    const blastResult = blastEngine.analyze(failedServiceIds);

    const pathExplorer = new PathExplorerEngine(allDeps);
    const maxGraphDepth = pathExplorer.calculateMaxDepth(allServices.map((s) => s.id));

    const criticalityMap = new Map(allServices.map((s) => [s.id, s.criticality as Criticality]));
    const severityEngine = new SeverityScoringEngine();
    const severity = severityEngine.calculate(
      blastResult,
      criticalityMap,
      allServices.length,
      maxGraphDepth,
    );

    const failedServiceNames = services.map((s) => s.name);
    const metadata: SimulationMetadata = {
      severityClassification: severity.classification,
      graphSnapshot,
      failedServiceNames,
      breakdown: severity.breakdown,
    };

    const simulationRow = await this.simulationRepo.create({
      name,
      failedServices: failedServiceIds,
      totalImpacted: blastResult.totalImpacted,
      severityScore: severity.score,
      metadata: metadata as unknown as Record<string, unknown>,
    });

    const resultsToInsert: Array<{
      simulationId: string;
      serviceId: string;
      impactType: 'DIRECT' | 'INDIRECT' | 'ROOT';
      impactDepth: number;
      dependencyPath: string[];
    }> = [];

    for (const failedId of failedServiceIds) {
      resultsToInsert.push({
        simulationId: simulationRow.id,
        serviceId: failedId,
        impactType: ImpactType.ROOT,
        impactDepth: 0,
        dependencyPath: [failedId],
      });
    }

    for (const serviceId of blastResult.directlyImpacted) {
      const paths = blastResult.impactPaths[serviceId] ?? [];
      resultsToInsert.push({
        simulationId: simulationRow.id,
        serviceId,
        impactType: ImpactType.DIRECT,
        impactDepth: blastResult.impactDepths[serviceId] ?? 1,
        dependencyPath: paths[0] ?? [],
      });
    }

    for (const serviceId of blastResult.indirectlyImpacted) {
      const paths = blastResult.impactPaths[serviceId] ?? [];
      resultsToInsert.push({
        simulationId: simulationRow.id,
        serviceId,
        impactType: ImpactType.INDIRECT,
        impactDepth: blastResult.impactDepths[serviceId] ?? 2,
        dependencyPath: paths[0] ?? [],
      });
    }

    await this.resultRepo.createMany(resultsToInsert);

    await this.auditRepo.create({
      entityType: AuditEntityType.SIMULATION,
      entityId: simulationRow.id,
      action: AuditAction.CREATE,
      payload: { name, failedServiceIds, severityScore: severity.score },
    });

    const simulation = this.toSimulation(simulationRow);
    const results = await this.getResults(simulationRow.id);

    appEvents.emitSimulationCompleted({ simulation, blastResult, severity });

    return { simulation, blastResult, severity, results };
  }

  async rerun(id: string) {
    const existing = await this.simulationRepo.findById(id);
    if (!existing) throw new NotFoundError('Simulation not found');

    return this.runSimulation({
      name: `${existing.name} (rerun)`,
      failedServiceIds: existing.failedServices,
    });
  }

  async getById(id: string) {
    const row = await this.simulationRepo.findById(id);
    if (!row) throw new NotFoundError('Simulation not found');
    return this.toSimulation(row);
  }

  async getResults(simulationId: string): Promise<SimulationResult[]> {
    const rows = await this.resultRepo.findBySimulationId(simulationId);
    return rows.map((r) => ({
      id: r.id,
      simulationId: r.simulationId,
      serviceId: r.serviceId,
      impactType: r.impactType as ImpactType,
      impactDepth: r.impactDepth,
      dependencyPath: r.dependencyPath,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async getHistory(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.simulationRepo.findAll(limit, offset),
      this.simulationRepo.count(),
    ]);

    return {
      data: rows.map((r) => this.toSimulation(r)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async compare(simulationIds: string[]): Promise<SimulationComparison> {
    const simulations = await this.simulationRepo.findByIds(simulationIds);
    if (simulations.length !== simulationIds.length) {
      throw new BadRequestError('One or more simulation IDs are invalid');
    }

    const mapped = simulations.map((r) => this.toSimulation(r));
    const failedSets = mapped.map((s) => new Set(s.failedServices));

    const commonFailedServices = [...failedSets[0]].filter((id) =>
      failedSets.every((set) => set.has(id)),
    );

    const uniqueImpacts: Record<string, string[]> = {};
    const severityDelta: Record<string, number> = {};

    for (let i = 0; i < mapped.length; i++) {
      for (let j = i + 1; j < mapped.length; j++) {
        const key = `${mapped[i].id}_vs_${mapped[j].id}`;
        severityDelta[key] = mapped[i].severityScore - mapped[j].severityScore;
      }
      const results = await this.resultRepo.findBySimulationId(mapped[i].id);
      uniqueImpacts[mapped[i].id] = results.map((r) => r.serviceId);
    }

    return {
      simulations: mapped,
      commonFailedServices,
      uniqueImpacts,
      severityDelta,
    };
  }

  async getWithDetails(id: string) {
    const simulation = await this.getById(id);
    const results = await this.getResults(id);
    return { simulation, results };
  }

  toSimulation(row: {
    id: string;
    name: string;
    failedServices: string[];
    totalImpacted: number;
    severityScore: number;
    metadata: Record<string, unknown>;
    createdAt: Date;
  }): Simulation {
    return {
      id: row.id,
      name: row.name,
      failedServices: row.failedServices,
      totalImpacted: row.totalImpacted,
      severityScore: row.severityScore,
      metadata: row.metadata as unknown as SimulationMetadata,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
