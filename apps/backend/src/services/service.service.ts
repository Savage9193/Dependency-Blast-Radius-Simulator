import type {
  CreateServiceInput,
  UpdateServiceInput,
  ServiceFilterInput,
  PaginatedResponse,
  ServiceWithCounts,
} from '@dbrs/shared';
import { AuditAction, AuditEntityType } from '@dbrs/shared';
import {
  ServiceRepository,
  DependencyRepository,
  AuditLogRepository,
} from '../db/repositories';
import { toService, sanitizeString } from '../utils/mappers';
import { ConflictError, NotFoundError } from '../utils/errors';
import { appEvents } from '../events/app-events';

export class ServiceService {
  constructor(
    private serviceRepo = new ServiceRepository(),
    private dependencyRepo = new DependencyRepository(),
    private auditRepo = new AuditLogRepository(),
  ) {}

  async create(input: CreateServiceInput) {
    const name = sanitizeString(input.name);
    const existing = await this.serviceRepo.findByName(name);
    if (existing) {
      throw new ConflictError(`Service with name "${name}" already exists`);
    }

    const row = await this.serviceRepo.create({
      name,
      description: sanitizeString(input.description ?? ''),
      owner: sanitizeString(input.owner),
      team: sanitizeString(input.team),
      criticality: input.criticality,
      status: input.status,
    });

    const service = toService(row);
    await this.auditRepo.create({
      entityType: AuditEntityType.SERVICE,
      entityId: row.id,
      action: AuditAction.CREATE,
      payload: { service },
    });

    appEvents.emitServiceCreated(service);
    appEvents.emitHealthUpdated(await this.getHealthCounts());

    return service;
  }

  async getById(id: string) {
    const row = await this.serviceRepo.findById(id);
    if (!row) throw new NotFoundError('Service not found');
    return toService(row);
  }

  async getByIdWithCounts(id: string): Promise<ServiceWithCounts> {
    const service = await this.getById(id);
    const upstream = await this.dependencyRepo.getUpstream(id);
    const downstream = await this.dependencyRepo.getDownstream(id);
    return {
      ...service,
      upstreamCount: upstream.length,
      downstreamCount: downstream.length,
      totalDependencies: upstream.length + downstream.length,
    };
  }

  async update(id: string, input: UpdateServiceInput) {
    const existing = await this.serviceRepo.findById(id);
    if (!existing) throw new NotFoundError('Service not found');

    if (input.name && input.name !== existing.name) {
      const duplicate = await this.serviceRepo.findByName(sanitizeString(input.name));
      if (duplicate) {
        throw new ConflictError(`Service with name "${input.name}" already exists`);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (input.name) updateData.name = sanitizeString(input.name);
    if (input.description !== undefined) updateData.description = sanitizeString(input.description);
    if (input.owner) updateData.owner = sanitizeString(input.owner);
    if (input.team) updateData.team = sanitizeString(input.team);
    if (input.criticality) updateData.criticality = input.criticality;
    if (input.status) updateData.status = input.status;

    const row = await this.serviceRepo.update(id, updateData);
    if (!row) throw new NotFoundError('Service not found');

    const service = toService(row);
    await this.auditRepo.create({
      entityType: AuditEntityType.SERVICE,
      entityId: id,
      action: AuditAction.UPDATE,
      payload: { before: toService(existing), after: service },
    });

    appEvents.emitServiceUpdated(service);
    appEvents.emitHealthUpdated(await this.getHealthCounts());

    return service;
  }

  async delete(id: string) {
    const existing = await this.serviceRepo.findById(id);
    if (!existing) throw new NotFoundError('Service not found');

    await this.serviceRepo.delete(id);
    await this.auditRepo.create({
      entityType: AuditEntityType.SERVICE,
      entityId: id,
      action: AuditAction.DELETE,
      payload: { service: toService(existing) },
    });

    appEvents.emitServiceDeleted({ id });
    appEvents.emitGraphUpdated({ type: 'service_deleted', id });
    appEvents.emitHealthUpdated(await this.getHealthCounts());

    return { success: true };
  }

  async list(filters: ServiceFilterInput): Promise<PaginatedResponse<ServiceWithCounts>> {
    const { rows, total } = await this.serviceRepo.findAll(filters);
    const depCounts = await this.dependencyRepo.getDependencyCounts();

    let servicesWithCounts = rows.map((row) => {
      const counts = depCounts.get(row.id) ?? { upstream: 0, downstream: 0 };
      return {
        ...toService(row),
        upstreamCount: counts.upstream,
        downstreamCount: counts.downstream,
        totalDependencies: counts.upstream + counts.downstream,
      };
    });

    if (filters.minDependencyCount !== undefined) {
      servicesWithCounts = servicesWithCounts.filter(
        (s) => s.totalDependencies >= filters.minDependencyCount!,
      );
    }
    if (filters.maxDependencyCount !== undefined) {
      servicesWithCounts = servicesWithCounts.filter(
        (s) => s.totalDependencies <= filters.maxDependencyCount!,
      );
    }

    return {
      data: servicesWithCounts,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  private async getHealthCounts() {
    const statusCounts = await this.serviceRepo.countByStatus();
    return { statusCounts, timestamp: new Date().toISOString() };
  }
}
