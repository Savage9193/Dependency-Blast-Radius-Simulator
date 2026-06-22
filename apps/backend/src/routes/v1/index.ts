import { Router } from 'express';
import {
  createServiceSchema,
  updateServiceSchema,
  serviceFilterSchema,
  createDependencySchema,
  createSimulationSchema,
  compareSimulationsSchema,
  pathExplorerSchema,
  idParamSchema,
} from '@dbrs/shared';
import { validateBody, validateQuery, validateParams } from '../../middlewares/validate';
import { ServiceController } from '../../controllers/service.controller';
import { DependencyController } from '../../controllers/dependency.controller';
import { SimulationController } from '../../controllers/simulation.controller';
import { HealthController } from '../../controllers/health.controller';

const serviceController = new ServiceController();
const dependencyController = new DependencyController();
const simulationController = new SimulationController();
const healthController = new HealthController();

export const v1Router = Router();

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     tags: [Health]
 *     summary: Get health dashboard metrics
 *     responses:
 *       200:
 *         description: Dashboard metrics
 */
v1Router.get('/health', healthController.getDashboard.bind(healthController));

/**
 * @openapi
 * /api/v1/analytics:
 *   get:
 *     tags: [Analytics]
 *     summary: Get analytics trends
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Analytics trends
 */
v1Router.get('/analytics', healthController.getAnalytics.bind(healthController));

/**
 * @openapi
 * /api/v1/services:
 *   get:
 *     tags: [Services]
 *     summary: List services with pagination and filters
 *   post:
 *     tags: [Services]
 *     summary: Create a new service
 */
v1Router.get(
  '/services',
  validateQuery(serviceFilterSchema),
  serviceController.list.bind(serviceController),
);
v1Router.post(
  '/services',
  validateBody(createServiceSchema),
  serviceController.create.bind(serviceController),
);

/**
 * @openapi
 * /api/v1/services/{id}:
 *   get:
 *     tags: [Services]
 *     summary: Get service by ID
 *   put:
 *     tags: [Services]
 *     summary: Update service
 *   delete:
 *     tags: [Services]
 *     summary: Delete service
 */
v1Router.get(
  '/services/:id',
  validateParams(idParamSchema),
  serviceController.getById.bind(serviceController),
);
v1Router.put(
  '/services/:id',
  validateParams(idParamSchema),
  validateBody(updateServiceSchema),
  serviceController.update.bind(serviceController),
);
v1Router.delete(
  '/services/:id',
  validateParams(idParamSchema),
  serviceController.delete.bind(serviceController),
);

v1Router.get('/dependencies', dependencyController.getAll.bind(dependencyController));
v1Router.post(
  '/dependencies',
  validateBody(createDependencySchema),
  dependencyController.create.bind(dependencyController),
);
v1Router.delete(
  '/dependencies/:id',
  validateParams(idParamSchema),
  dependencyController.delete.bind(dependencyController),
);
v1Router.get('/dependencies/graph', dependencyController.getGraph.bind(dependencyController));
v1Router.get('/dependencies/cycles', dependencyController.detectCycles.bind(dependencyController));
v1Router.get(
  '/dependencies/paths',
  validateQuery(pathExplorerSchema),
  dependencyController.explorePath.bind(dependencyController),
);
v1Router.get(
  '/dependencies/upstream/:serviceId',
  dependencyController.getUpstream.bind(dependencyController),
);
v1Router.get(
  '/dependencies/downstream/:serviceId',
  dependencyController.getDownstream.bind(dependencyController),
);
v1Router.get(
  '/dependencies/stats/:serviceId',
  dependencyController.getStats.bind(dependencyController),
);

v1Router.post(
  '/simulations',
  validateBody(createSimulationSchema),
  simulationController.run.bind(simulationController),
);
v1Router.get('/simulations', simulationController.getHistory.bind(simulationController));
v1Router.get(
  '/simulations/:id',
  validateParams(idParamSchema),
  simulationController.getById.bind(simulationController),
);
v1Router.post(
  '/simulations/:id/rerun',
  validateParams(idParamSchema),
  simulationController.rerun.bind(simulationController),
);
v1Router.post(
  '/simulations/compare',
  validateBody(compareSimulationsSchema),
  simulationController.compare.bind(simulationController),
);
