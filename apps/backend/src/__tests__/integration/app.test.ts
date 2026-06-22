import request from 'supertest';
import { Criticality, ServiceStatus } from '@dbrs/shared';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/dbrs_test';
process.env.PORT = '3099';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_MAX = '10000';

const SERVICE_A_ID = '11111111-1111-4111-8111-111111111111';
const SERVICE_B_ID = '22222222-2222-4222-8222-222222222222';
const SERVICE_C_ID = '33333333-3333-4333-8333-333333333333';
const DEP_AB_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SIMULATION_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const now = new Date('2025-06-01T12:00:00.000Z');

function serviceRow(overrides: Record<string, unknown> = {}) {
  return {
    id: SERVICE_A_ID,
    name: 'API Gateway',
    description: 'Edge gateway',
    owner: 'platform-team',
    team: 'platform',
    criticality: Criticality.HIGH,
    status: ServiceStatus.HEALTHY,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function dependencyRow(overrides: Record<string, unknown> = {}) {
  return {
    id: DEP_AB_ID,
    sourceServiceId: SERVICE_A_ID,
    targetServiceId: SERVICE_B_ID,
    createdAt: now,
    ...overrides,
  };
}

const mockServiceRepo = {
  create: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
  findAllIds: jest.fn(),
  countByStatus: jest.fn(),
  countByCriticality: jest.fn(),
  count: jest.fn(),
  findByIds: jest.fn(),
};

const mockDependencyRepo = {
  create: jest.fn(),
  findById: jest.fn(),
  findByPair: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  getUpstream: jest.fn(),
  getDownstream: jest.fn(),
  getMostConnected: jest.fn(),
  getDependencyCounts: jest.fn(),
};

const mockSimulationRepo = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  findByIds: jest.fn(),
  getTrends: jest.fn(),
};

const mockSimulationResultRepo = {
  createMany: jest.fn(),
  findBySimulationId: jest.fn(),
  getMostImpacted: jest.fn(),
};

const mockAuditRepo = {
  create: jest.fn(),
  findByEntity: jest.fn(),
};

jest.mock('../../db/repositories', () => ({
  ServiceRepository: jest.fn().mockImplementation(() => mockServiceRepo),
  DependencyRepository: jest.fn().mockImplementation(() => mockDependencyRepo),
  SimulationRepository: jest.fn().mockImplementation(() => mockSimulationRepo),
  SimulationResultRepository: jest.fn().mockImplementation(() => mockSimulationResultRepo),
  AuditLogRepository: jest.fn().mockImplementation(() => mockAuditRepo),
}));

jest.mock('../../sockets', () => ({
  initSocketServer: jest.fn(),
}));

import { createApp } from '../../index';
import { resetEnvCache } from '../../config/env';

describe('API integration', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
    resetEnvCache();

    mockServiceRepo.countByStatus.mockResolvedValue({ HEALTHY: 2, DEGRADED: 0, FAILED: 0 });
    mockServiceRepo.countByCriticality.mockResolvedValue({ HIGH: 1, MEDIUM: 1 });
    mockServiceRepo.count.mockResolvedValue(2);
    mockServiceRepo.findAllIds.mockResolvedValue([
      serviceRow({ id: SERVICE_A_ID, name: 'API Gateway' }),
      serviceRow({
        id: SERVICE_B_ID,
        name: 'Auth Service',
        criticality: Criticality.MEDIUM,
      }),
    ]);
    mockServiceRepo.findAll.mockResolvedValue({
      rows: [
        serviceRow({ id: SERVICE_A_ID, name: 'API Gateway' }),
        serviceRow({
          id: SERVICE_B_ID,
          name: 'Auth Service',
          criticality: Criticality.MEDIUM,
        }),
      ],
      total: 2,
    });
    mockServiceRepo.findById.mockImplementation(async (id: string) => {
      const services = [
        serviceRow({ id: SERVICE_A_ID, name: 'API Gateway' }),
        serviceRow({
          id: SERVICE_B_ID,
          name: 'Auth Service',
          criticality: Criticality.MEDIUM,
        }),
        serviceRow({
          id: SERVICE_C_ID,
          name: 'Database',
          criticality: Criticality.CRITICAL,
        }),
      ];
      return services.find((s) => s.id === id) ?? null;
    });
    mockServiceRepo.findByIds.mockImplementation(async (ids: string[]) => {
      const all = [
        serviceRow({ id: SERVICE_A_ID }),
        serviceRow({ id: SERVICE_B_ID, criticality: Criticality.MEDIUM }),
        serviceRow({ id: SERVICE_C_ID, criticality: Criticality.CRITICAL }),
      ];
      return all.filter((s) => ids.includes(s.id));
    });
    mockServiceRepo.findByName.mockResolvedValue(null);
    mockServiceRepo.create.mockImplementation(async (data: Record<string, unknown>) =>
      serviceRow({ id: SERVICE_C_ID, ...data }),
    );

    mockDependencyRepo.findAll.mockResolvedValue([
      dependencyRow(),
      dependencyRow({
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        sourceServiceId: SERVICE_B_ID,
        targetServiceId: SERVICE_C_ID,
      }),
    ]);
    mockDependencyRepo.count.mockResolvedValue(2);
    mockDependencyRepo.getMostConnected.mockResolvedValue([[SERVICE_A_ID, 2]]);
    mockDependencyRepo.getDependencyCounts.mockResolvedValue(
      new Map([
        [SERVICE_A_ID, { upstream: 1, downstream: 0 }],
        [SERVICE_B_ID, { upstream: 0, downstream: 1 }],
      ]),
    );
    mockDependencyRepo.findByPair.mockResolvedValue(null);
    mockDependencyRepo.getUpstream.mockResolvedValue([dependencyRow()]);
    mockDependencyRepo.getDownstream.mockResolvedValue([]);
    mockDependencyRepo.create.mockResolvedValue(dependencyRow());

    mockSimulationRepo.count.mockResolvedValue(0);
    mockSimulationRepo.findAll.mockResolvedValue([]);
    mockSimulationRepo.getTrends.mockResolvedValue([]);
    mockSimulationRepo.create.mockResolvedValue({
      id: SIMULATION_ID,
      name: 'DB outage',
      failedServices: [SERVICE_C_ID],
      totalImpacted: 2,
      severityScore: 42,
      metadata: {
        severityClassification: 'MEDIUM',
        graphSnapshot: { nodes: [], edges: [] },
        failedServiceNames: ['Database'],
        breakdown: { affectedScore: 16, depthScore: 10, criticalityScore: 12, rootScore: 2 },
      },
      createdAt: now,
    });
    mockSimulationRepo.findById.mockResolvedValue({
      id: SIMULATION_ID,
      name: 'DB outage',
      failedServices: [SERVICE_C_ID],
      totalImpacted: 2,
      severityScore: 42,
      metadata: {},
      createdAt: now,
    });

    mockSimulationResultRepo.createMany.mockResolvedValue([]);
    mockSimulationResultRepo.findBySimulationId.mockResolvedValue([]);
    mockSimulationResultRepo.getMostImpacted.mockResolvedValue([]);

    mockAuditRepo.create.mockResolvedValue({
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      entityType: 'SIMULATION',
      entityId: SIMULATION_ID,
      action: 'CREATE',
      payload: {},
      createdAt: now,
    });
  });

  describe('health endpoints', () => {
    it('GET /health returns ok status without touching the database', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });

    it('GET /api/v1/health returns dashboard metrics from repositories', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body.totalServices).toBe(2);
      expect(response.body.totalDependencies).toBe(2);
      expect(response.body.healthyServices).toBe(2);
      expect(response.body.mostConnectedServices).toEqual([
        { id: SERVICE_A_ID, name: 'API Gateway', connectionCount: 2 },
      ]);
    });
  });

  describe('services', () => {
    it('GET /api/v1/services returns paginated services', async () => {
      const response = await request(app).get('/api/v1/services');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('GET /api/v1/services/:id returns a service with dependency counts', async () => {
      const response = await request(app).get(`/api/v1/services/${SERVICE_A_ID}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(SERVICE_A_ID);
      expect(response.body.name).toBe('API Gateway');
    });

    it('GET /api/v1/services/:id returns 404 when service is missing', async () => {
      mockServiceRepo.findById.mockResolvedValue(null);

      const response = await request(app).get(
        `/api/v1/services/99999999-9999-4999-8999-999999999999`,
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('NotFoundError');
    });

    it('POST /api/v1/services validates request body', async () => {
      const response = await request(app).post('/api/v1/services').send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('AppError');
    });
  });

  describe('dependencies', () => {
    it('GET /api/v1/dependencies/graph returns nodes and edges', async () => {
      const response = await request(app).get('/api/v1/dependencies/graph');

      expect(response.status).toBe(200);
      expect(response.body.nodes).toHaveLength(2);
      expect(response.body.edges).toHaveLength(2);
    });

    it('GET /api/v1/dependencies/cycles returns cycle detection results', async () => {
      const response = await request(app).get('/api/v1/dependencies/cycles');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('GET /api/v1/dependencies/cycles detects cycles in mocked graph data', async () => {
      mockDependencyRepo.findAll.mockResolvedValue([
        dependencyRow({ sourceServiceId: SERVICE_A_ID, targetServiceId: SERVICE_B_ID }),
        dependencyRow({
          id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
          sourceServiceId: SERVICE_B_ID,
          targetServiceId: SERVICE_A_ID,
        }),
      ]);

      const response = await request(app).get('/api/v1/dependencies/cycles');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].hasCycle).toBe(true);
    });

    it('GET /api/v1/dependencies/paths explores dependency paths', async () => {
      const response = await request(app).get('/api/v1/dependencies/paths').query({
        rootServiceId: SERVICE_A_ID,
        targetServiceId: SERVICE_B_ID,
      });

      expect(response.status).toBe(200);
      expect(response.body.rootServiceId).toBe(SERVICE_A_ID);
      expect(response.body.targetServiceId).toBe(SERVICE_B_ID);
      expect(response.body.shortestPath).toEqual([SERVICE_A_ID, SERVICE_B_ID]);
    });

    it('GET /api/v1/dependencies/paths validates query parameters', async () => {
      const response = await request(app).get('/api/v1/dependencies/paths').query({
        rootServiceId: 'not-a-uuid',
        targetServiceId: SERVICE_B_ID,
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('AppError');
    });

    it('GET /api/v1/dependencies/paths returns 404 for unknown services', async () => {
      mockServiceRepo.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/v1/dependencies/paths').query({
        rootServiceId: SERVICE_A_ID,
        targetServiceId: SERVICE_B_ID,
      });

      expect(response.status).toBe(404);
    });
  });

  describe('simulations', () => {
    it('POST /api/v1/simulations runs a blast radius simulation', async () => {
      const response = await request(app)
        .post('/api/v1/simulations')
        .send({
          name: 'Database failure drill',
          failedServiceIds: [SERVICE_C_ID],
        });

      expect(response.status).toBe(201);
      expect(response.body.simulation.name).toBe('DB outage');
      expect(response.body.blastResult.failedServices).toEqual([SERVICE_C_ID]);
      expect(response.body.severity.classification).toBeDefined();
      expect(mockSimulationRepo.create).toHaveBeenCalled();
      expect(mockSimulationResultRepo.createMany).toHaveBeenCalled();
    });

    it('POST /api/v1/simulations rejects invalid failed service IDs', async () => {
      mockServiceRepo.findByIds.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/v1/simulations')
        .send({
          name: 'Invalid simulation',
          failedServiceIds: [SERVICE_C_ID],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('invalid');
    });

    it('POST /api/v1/simulations validates request payload', async () => {
      const response = await request(app).post('/api/v1/simulations').send({
        name: '',
        failedServiceIds: [],
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('AppError');
    });

    it('GET /api/v1/simulations returns simulation history', async () => {
      mockSimulationRepo.findAll.mockResolvedValue([
        {
          id: SIMULATION_ID,
          name: 'DB outage',
          failedServices: [SERVICE_C_ID],
          totalImpacted: 2,
          severityScore: 42,
          metadata: {},
          createdAt: now,
        },
      ]);
      mockSimulationRepo.count.mockResolvedValue(1);

      const response = await request(app).get('/api/v1/simulations');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
    });
  });

  describe('routing and errors', () => {
    it('returns 404 for unknown routes', async () => {
      const response = await request(app).get('/api/v1/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('NotFound');
    });
  });

  describe('empty graph edge cases via API', () => {
    beforeEach(() => {
      mockDependencyRepo.findAll.mockResolvedValue([]);
      mockServiceRepo.findAllIds.mockResolvedValue([
        serviceRow({ id: SERVICE_A_ID, name: 'Lonely Service' }),
      ]);
      mockServiceRepo.findByIds.mockResolvedValue([serviceRow({ id: SERVICE_A_ID })]);
    });

    it('GET /api/v1/dependencies/cycles returns empty array for an empty graph', async () => {
      const response = await request(app).get('/api/v1/dependencies/cycles');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('POST /api/v1/simulations handles isolated service failure with zero blast radius', async () => {
      mockSimulationRepo.create.mockResolvedValue({
        id: SIMULATION_ID,
        name: 'Isolated failure',
        failedServices: [SERVICE_A_ID],
        totalImpacted: 0,
        severityScore: 5,
        metadata: {},
        createdAt: now,
      });

      const response = await request(app)
        .post('/api/v1/simulations')
        .send({
          name: 'Isolated failure',
          failedServiceIds: [SERVICE_A_ID],
        });

      expect(response.status).toBe(201);
      expect(response.body.blastResult.totalImpacted).toBe(0);
      expect(response.body.blastResult.allImpacted).toEqual([]);
    });
  });
});
