import type { CreateDependencyInput, DependencyGraph } from '@dbrs/shared';
import { AuditAction, AuditEntityType, Criticality, ServiceStatus } from '@dbrs/shared';
import {
  ServiceRepository,
  DependencyRepository,
  AuditLogRepository,
} from '../db/repositories';
import { ConflictError, NotFoundError, BadRequestError } from '../utils/errors';
import { CycleDetector } from './engines/cycle-detector';
import { PathExplorerEngine } from './engines/path-explorer-engine';
import { appEvents } from '../events/app-events';

export class DependencyService {
  constructor(
    private dependencyRepo = new DependencyRepository(),
    private serviceRepo = new ServiceRepository(),
    private auditRepo = new AuditLogRepository(),
  ) {}

  async create(input: CreateDependencyInput) {
    const { sourceServiceId, targetServiceId } = input;

    if (sourceServiceId === targetServiceId) {
      throw new BadRequestError('A service cannot depend on itself');
    }

    const [source, target] = await Promise.all([
      this.serviceRepo.findById(sourceServiceId),
      this.serviceRepo.findById(targetServiceId),
    ]);

    if (!source) throw new NotFoundError('Source service not found');
    if (!target) throw new NotFoundError('Target service not found');

    const existing = await this.dependencyRepo.findByPair(sourceServiceId, targetServiceId);
    if (existing) {
      throw new ConflictError('Dependency already exists between these services');
    }

    const allDeps = await this.dependencyRepo.findAll();
    const allServices = await this.serviceRepo.findAllIds();
    const serviceNames = new Map(allServices.map((s) => [s.id, s.name]));

    const detector = new CycleDetector(allDeps, serviceNames);
    const cycleResult = detector.wouldCreateCycle(sourceServiceId, targetServiceId);

    if (cycleResult.hasCycle) {
      throw new ConflictError(
        `Creating this dependency would introduce a circular dependency: ${cycleResult.cycleServices?.join(' → ')}`,
        { cyclePath: cycleResult.cyclePath, cycleServices: cycleResult.cycleServices },
      );
    }

    const row = await this.dependencyRepo.create(sourceServiceId, targetServiceId);

    const dependency = {
      id: row.id,
      sourceServiceId: row.sourceServiceId,
      targetServiceId: row.targetServiceId,
      createdAt: row.createdAt.toISOString(),
    };

    await this.auditRepo.create({
      entityType: AuditEntityType.DEPENDENCY,
      entityId: row.id,
      action: AuditAction.CREATE,
      payload: { dependency },
    });

    appEvents.emitDependencyCreated(dependency);
    return dependency;
  }

  async delete(id: string) {
    const existing = await this.dependencyRepo.findById(id);
    if (!existing) throw new NotFoundError('Dependency not found');

    await this.dependencyRepo.delete(id);
    await this.auditRepo.create({
      entityType: AuditEntityType.DEPENDENCY,
      entityId: id,
      action: AuditAction.DELETE,
      payload: { dependency: existing },
    });

    appEvents.emitDependencyDeleted({ id });
    return { success: true };
  }

  async getGraph(): Promise<DependencyGraph> {
    const [services, deps] = await Promise.all([
      this.serviceRepo.findAllIds(),
      this.dependencyRepo.findAll(),
    ]);

    return {
      nodes: services.map((s) => ({
        id: s.id,
        name: s.name,
        criticality: s.criticality as Criticality,
        status: s.status as ServiceStatus,
        team: s.team,
      })),
      edges: deps.map((d) => ({
        id: d.id,
        source: d.sourceServiceId,
        target: d.targetServiceId,
      })),
    };
  }

  async getUpstream(serviceId: string) {
    const service = await this.serviceRepo.findById(serviceId);
    if (!service) throw new NotFoundError('Service not found');
    const deps = await this.dependencyRepo.getUpstream(serviceId);
    return deps.map((d) => ({
      id: d.id,
      sourceServiceId: d.sourceServiceId,
      targetServiceId: d.targetServiceId,
      createdAt: d.createdAt.toISOString(),
    }));
  }

  async getDownstream(serviceId: string) {
    const service = await this.serviceRepo.findById(serviceId);
    if (!service) throw new NotFoundError('Service not found');
    const deps = await this.dependencyRepo.getDownstream(serviceId);
    return deps.map((d) => ({
      id: d.id,
      sourceServiceId: d.sourceServiceId,
      targetServiceId: d.targetServiceId,
      createdAt: d.createdAt.toISOString(),
    }));
  }

  async getDependencyStats(serviceId: string) {
    const service = await this.serviceRepo.findById(serviceId);
    if (!service) throw new NotFoundError('Service not found');

    const allDeps = await this.dependencyRepo.findAll();
    const explorer = new PathExplorerEngine(allDeps);
    const allServices = await this.serviceRepo.findAllIds();
    const maxDepth = explorer.calculateMaxDepth(allServices.map((s) => s.id));

    const upstream = await this.dependencyRepo.getUpstream(serviceId);
    const downstream = await this.dependencyRepo.getDownstream(serviceId);

    return {
      serviceId,
      upstreamCount: upstream.length,
      downstreamCount: downstream.length,
      totalConnections: upstream.length + downstream.length,
      maxGraphDepth: maxDepth,
    };
  }

  async detectCycles() {
    const [allDeps, allServices] = await Promise.all([
      this.dependencyRepo.findAll(),
      this.serviceRepo.findAllIds(),
    ]);
    const serviceNames = new Map(allServices.map((s) => [s.id, s.name]));
    const detector = new CycleDetector(allDeps, serviceNames);
    return detector.detectAllCycles();
  }

  async explorePath(rootServiceId: string, targetServiceId: string) {
    const [root, target] = await Promise.all([
      this.serviceRepo.findById(rootServiceId),
      this.serviceRepo.findById(targetServiceId),
    ]);
    if (!root) throw new NotFoundError('Root service not found');
    if (!target) throw new NotFoundError('Target service not found');

    const allDeps = await this.dependencyRepo.findAll();
    const explorer = new PathExplorerEngine(allDeps);
    return explorer.explore(rootServiceId, targetServiceId);
  }

  async getAllDependencies() {
    const deps = await this.dependencyRepo.findAll();
    return deps.map((d) => ({
      id: d.id,
      sourceServiceId: d.sourceServiceId,
      targetServiceId: d.targetServiceId,
      createdAt: d.createdAt.toISOString(),
    }));
  }
}
