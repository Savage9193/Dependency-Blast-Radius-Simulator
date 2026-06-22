import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const criticalityEnum = pgEnum('criticality', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const serviceStatusEnum = pgEnum('service_status', ['HEALTHY', 'DEGRADED', 'FAILED']);
export const impactTypeEnum = pgEnum('impact_type', ['DIRECT', 'INDIRECT', 'ROOT']);
export const auditActionEnum = pgEnum('audit_action', ['CREATE', 'UPDATE', 'DELETE']);
export const auditEntityTypeEnum = pgEnum('audit_entity_type', ['SERVICE', 'DEPENDENCY', 'SIMULATION']);

export const services = pgTable(
  'services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description').notNull().default(''),
    owner: varchar('owner', { length: 100 }).notNull(),
    team: varchar('team', { length: 100 }).notNull(),
    criticality: criticalityEnum('criticality').notNull().default('MEDIUM'),
    status: serviceStatusEnum('status').notNull().default('HEALTHY'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('services_name_unique').on(table.name),
    index('services_team_idx').on(table.team),
    index('services_owner_idx').on(table.owner),
    index('services_criticality_idx').on(table.criticality),
    index('services_status_idx').on(table.status),
  ],
);

export const dependencies = pgTable(
  'dependencies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sourceServiceId: uuid('source_service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    targetServiceId: uuid('target_service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('dependencies_unique').on(table.sourceServiceId, table.targetServiceId),
    index('dependencies_source_idx').on(table.sourceServiceId),
    index('dependencies_target_idx').on(table.targetServiceId),
  ],
);

export const simulations = pgTable(
  'simulations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    failedServices: jsonb('failed_services').$type<string[]>().notNull(),
    totalImpacted: integer('total_impacted').notNull().default(0),
    severityScore: integer('severity_score').notNull().default(0),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('simulations_created_at_idx').on(table.createdAt)],
);

export const simulationResults = pgTable(
  'simulation_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    simulationId: uuid('simulation_id')
      .notNull()
      .references(() => simulations.id, { onDelete: 'cascade' }),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    impactType: impactTypeEnum('impact_type').notNull(),
    impactDepth: integer('impact_depth').notNull().default(0),
    dependencyPath: jsonb('dependency_path').$type<string[]>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('simulation_results_simulation_idx').on(table.simulationId),
    index('simulation_results_service_idx').on(table.serviceId),
  ],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityType: auditEntityTypeEnum('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    action: auditActionEnum('action').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_logs_entity_idx').on(table.entityType, table.entityId),
    index('audit_logs_created_at_idx').on(table.createdAt),
  ],
);

export type ServiceRow = typeof services.$inferSelect;
export type NewServiceRow = typeof services.$inferInsert;
export type DependencyRow = typeof dependencies.$inferSelect;
export type SimulationRow = typeof simulations.$inferSelect;
export type SimulationResultRow = typeof simulationResults.$inferSelect;
export type AuditLogRow = typeof auditLogs.$inferSelect;
