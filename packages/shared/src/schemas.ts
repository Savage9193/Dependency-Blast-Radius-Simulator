import { z } from 'zod';
import { Criticality, ServiceStatus } from './enums';

export const criticalitySchema = z.nativeEnum(Criticality);
export const serviceStatusSchema = z.nativeEnum(ServiceStatus);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createServiceSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(1000).optional().default(''),
  owner: z.string().min(1).max(100).trim(),
  team: z.string().min(1).max(100).trim(),
  criticality: criticalitySchema.default(Criticality.MEDIUM),
  status: serviceStatusSchema.default(ServiceStatus.HEALTHY),
});

export const updateServiceSchema = createServiceSchema.partial();

export const serviceFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  owner: z.string().optional(),
  team: z.string().optional(),
  criticality: criticalitySchema.optional(),
  status: serviceStatusSchema.optional(),
  minDependencyCount: z.coerce.number().int().min(0).optional(),
  maxDependencyCount: z.coerce.number().int().min(0).optional(),
});

export const createDependencySchema = z.object({
  sourceServiceId: z.string().uuid(),
  targetServiceId: z.string().uuid(),
});

export const createSimulationSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  failedServiceIds: z.array(z.string().uuid()).min(1),
});

export const compareSimulationsSchema = z.object({
  simulationIds: z.array(z.string().uuid()).min(2).max(10),
});

export const pathExplorerSchema = z.object({
  rootServiceId: z.string().uuid(),
  targetServiceId: z.string().uuid(),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceFilterInput = z.infer<typeof serviceFilterSchema>;
export type CreateDependencyInput = z.infer<typeof createDependencySchema>;
export type CreateSimulationInput = z.infer<typeof createSimulationSchema>;
