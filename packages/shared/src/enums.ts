export enum Criticality {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ServiceStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  FAILED = 'FAILED',
}

export enum ImpactType {
  DIRECT = 'DIRECT',
  INDIRECT = 'INDIRECT',
  ROOT = 'ROOT',
}

export enum SeverityClassification {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum AuditEntityType {
  SERVICE = 'SERVICE',
  DEPENDENCY = 'DEPENDENCY',
  SIMULATION = 'SIMULATION',
}

export const CRITICALITY_WEIGHTS: Record<Criticality, number> = {
  [Criticality.LOW]: 1,
  [Criticality.MEDIUM]: 2,
  [Criticality.HIGH]: 3,
  [Criticality.CRITICAL]: 5,
};

export const SEVERITY_THRESHOLDS = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  CRITICAL: 100,
} as const;
