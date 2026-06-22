import { eq, and, or, ilike, sql, desc, asc, count, inArray } from 'drizzle-orm';
import { getDb } from '../client';
import {
  services,
  dependencies,
  simulations,
  simulationResults,
  auditLogs,
  type ServiceRow,
  type NewServiceRow,
} from '../schema';
import type { ServiceFilterInput } from '@dbrs/shared';

export class ServiceRepository {
  async create(data: NewServiceRow): Promise<ServiceRow> {
    const [row] = await getDb().insert(services).values(data).returning();
    return row;
  }

  async findById(id: string): Promise<ServiceRow | null> {
    const [row] = await getDb().select().from(services).where(eq(services.id, id)).limit(1);
    return row ?? null;
  }

  async findByName(name: string): Promise<ServiceRow | null> {
    const [row] = await getDb().select().from(services).where(eq(services.name, name)).limit(1);
    return row ?? null;
  }

  async update(id: string, data: Partial<NewServiceRow>): Promise<ServiceRow | null> {
    const [row] = await getDb()
      .update(services)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await getDb().delete(services).where(eq(services.id, id)).returning();
    return result.length > 0;
  }

  async findAll(filters: ServiceFilterInput): Promise<{ rows: ServiceRow[]; total: number }> {
    const conditions = this.buildConditions(filters);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn = this.getSortColumn(filters.sortBy);
    const orderFn = filters.sortOrder === 'asc' ? asc : desc;
    const offset = (filters.page - 1) * filters.limit;

    const [rows, totalResult] = await Promise.all([
      getDb()
        .select()
        .from(services)
        .where(whereClause)
        .orderBy(orderFn(sortColumn))
        .limit(filters.limit)
        .offset(offset),
      getDb().select({ count: count() }).from(services).where(whereClause),
    ]);

    return { rows, total: totalResult[0]?.count ?? 0 };
  }

  async findAllIds(): Promise<ServiceRow[]> {
    return getDb().select().from(services);
  }

  async countByStatus(): Promise<Record<string, number>> {
    const rows = await getDb()
      .select({ status: services.status, count: count() })
      .from(services)
      .groupBy(services.status);
    return Object.fromEntries(rows.map((r) => [r.status, r.count]));
  }

  async countByCriticality(): Promise<Record<string, number>> {
    const rows = await getDb()
      .select({ criticality: services.criticality, count: count() })
      .from(services)
      .groupBy(services.criticality);
    return Object.fromEntries(rows.map((r) => [r.criticality, r.count]));
  }

  async count(): Promise<number> {
    const [result] = await getDb().select({ count: count() }).from(services);
    return result?.count ?? 0;
  }

  async findByIds(ids: string[]): Promise<ServiceRow[]> {
    if (ids.length === 0) return [];
    return getDb().select().from(services).where(inArray(services.id, ids));
  }

  private buildConditions(filters: ServiceFilterInput) {
    const conditions = [];

    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(services.name, term),
          ilike(services.description, term),
          ilike(services.owner, term),
          ilike(services.team, term),
        ),
      );
    }
    if (filters.owner) conditions.push(eq(services.owner, filters.owner));
    if (filters.team) conditions.push(eq(services.team, filters.team));
    if (filters.criticality) conditions.push(eq(services.criticality, filters.criticality));
    if (filters.status) conditions.push(eq(services.status, filters.status));

    return conditions;
  }

  private getSortColumn(sortBy?: string) {
    switch (sortBy) {
      case 'name':
        return services.name;
      case 'owner':
        return services.owner;
      case 'team':
        return services.team;
      case 'criticality':
        return services.criticality;
      case 'status':
        return services.status;
      case 'createdAt':
        return services.createdAt;
      default:
        return services.updatedAt;
    }
  }
}

export class DependencyRepository {
  async create(sourceServiceId: string, targetServiceId: string) {
    const [row] = await getDb()
      .insert(dependencies)
      .values({ sourceServiceId, targetServiceId })
      .returning();
    return row;
  }

  async findById(id: string) {
    const [row] = await getDb()
      .select()
      .from(dependencies)
      .where(eq(dependencies.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByPair(sourceServiceId: string, targetServiceId: string) {
    const [row] = await getDb()
      .select()
      .from(dependencies)
      .where(
        and(
          eq(dependencies.sourceServiceId, sourceServiceId),
          eq(dependencies.targetServiceId, targetServiceId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await getDb().delete(dependencies).where(eq(dependencies.id, id)).returning();
    return result.length > 0;
  }

  async findAll() {
    return getDb().select().from(dependencies);
  }

  async count(): Promise<number> {
    const [result] = await getDb().select({ count: count() }).from(dependencies);
    return result?.count ?? 0;
  }

  async getUpstream(serviceId: string) {
    return getDb()
      .select()
      .from(dependencies)
      .where(eq(dependencies.sourceServiceId, serviceId));
  }

  async getDownstream(serviceId: string) {
    return getDb()
      .select()
      .from(dependencies)
      .where(eq(dependencies.targetServiceId, serviceId));
  }

  async getDependencyCounts(): Promise<Map<string, { upstream: number; downstream: number }>> {
    const allDeps = await this.findAll();
    const counts = new Map<string, { upstream: number; downstream: number }>();

    for (const dep of allDeps) {
      const sourceCounts = counts.get(dep.sourceServiceId) ?? { upstream: 0, downstream: 0 };
      sourceCounts.upstream++;
      counts.set(dep.sourceServiceId, sourceCounts);

      const targetCounts = counts.get(dep.targetServiceId) ?? { upstream: 0, downstream: 0 };
      targetCounts.downstream++;
      counts.set(dep.targetServiceId, targetCounts);
    }

    return counts;
  }

  async getMostConnected(limit = 5) {
    const allDeps = await this.findAll();
    const connectionCounts = new Map<string, number>();

    for (const dep of allDeps) {
      connectionCounts.set(
        dep.sourceServiceId,
        (connectionCounts.get(dep.sourceServiceId) ?? 0) + 1,
      );
      connectionCounts.set(
        dep.targetServiceId,
        (connectionCounts.get(dep.targetServiceId) ?? 0) + 1,
      );
    }

    return [...connectionCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }
}

export class SimulationRepository {
  async create(data: {
    name: string;
    failedServices: string[];
    totalImpacted: number;
    severityScore: number;
    metadata: Record<string, unknown>;
  }) {
    const [row] = await getDb().insert(simulations).values(data).returning();
    return row;
  }

  async findById(id: string) {
    const [row] = await getDb()
      .select()
      .from(simulations)
      .where(eq(simulations.id, id))
      .limit(1);
    return row ?? null;
  }

  async findAll(limit = 20, offset = 0) {
    return getDb()
      .select()
      .from(simulations)
      .orderBy(desc(simulations.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async count(): Promise<number> {
    const [result] = await getDb().select({ count: count() }).from(simulations);
    return result?.count ?? 0;
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return getDb().select().from(simulations).where(inArray(simulations.id, ids));
  }

  async getTrends(days = 30) {
    return getDb()
      .select({
        date: sql<string>`DATE(${simulations.createdAt})`.as('date'),
        count: count(),
        avgSeverity: sql<number>`AVG(${simulations.severityScore})`.as('avg_severity'),
        avgImpacted: sql<number>`AVG(${simulations.totalImpacted})`.as('avg_impacted'),
      })
      .from(simulations)
      .where(sql`${simulations.createdAt} >= NOW() - INTERVAL '${sql.raw(String(days))} days'`)
      .groupBy(sql`DATE(${simulations.createdAt})`)
      .orderBy(sql`DATE(${simulations.createdAt})`);
  }
}

export class SimulationResultRepository {
  async createMany(
    results: Array<{
      simulationId: string;
      serviceId: string;
      impactType: 'DIRECT' | 'INDIRECT' | 'ROOT';
      impactDepth: number;
      dependencyPath: string[];
    }>,
  ) {
    if (results.length === 0) return [];
    return getDb().insert(simulationResults).values(results).returning();
  }

  async findBySimulationId(simulationId: string) {
    return getDb()
      .select()
      .from(simulationResults)
      .where(eq(simulationResults.simulationId, simulationId));
  }

  async getMostImpacted(limit = 10) {
    return getDb()
      .select({
        serviceId: simulationResults.serviceId,
        impactCount: count(),
      })
      .from(simulationResults)
      .groupBy(simulationResults.serviceId)
      .orderBy(desc(count()))
      .limit(limit);
  }
}

export class AuditLogRepository {
  async create(data: {
    entityType: 'SERVICE' | 'DEPENDENCY' | 'SIMULATION';
    entityId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    payload: Record<string, unknown>;
  }) {
    const [row] = await getDb().insert(auditLogs).values(data).returning();
    return row;
  }

  async findByEntity(entityType: 'SERVICE' | 'DEPENDENCY' | 'SIMULATION', entityId: string) {
    return getDb()
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
      .orderBy(desc(auditLogs.createdAt));
  }
}
