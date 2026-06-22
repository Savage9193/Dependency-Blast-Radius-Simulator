import { DependencyService } from '../services/dependency.service';
import { getParam } from '../utils/params';

const dependencyService = new DependencyService();

export class DependencyController {
  async create(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      const dependency = await dependencyService.create(req.body);
      res.status(201).json(dependency);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      await dependencyService.delete(getParam(req.params.id));
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  async getGraph(_req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      const graph = await dependencyService.getGraph();
      res.json(graph);
    } catch (err) {
      next(err);
    }
  }

  async getAll(_req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      const deps = await dependencyService.getAllDependencies();
      res.json(deps);
    } catch (err) {
      next(err);
    }
  }

  async getUpstream(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      const deps = await dependencyService.getUpstream(getParam(req.params.serviceId));
      res.json(deps);
    } catch (err) {
      next(err);
    }
  }

  async getDownstream(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      const deps = await dependencyService.getDownstream(getParam(req.params.serviceId));
      res.json(deps);
    } catch (err) {
      next(err);
    }
  }

  async getStats(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      const stats = await dependencyService.getDependencyStats(getParam(req.params.serviceId));
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }

  async detectCycles(_req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      const cycles = await dependencyService.detectCycles();
      res.json(cycles);
    } catch (err) {
      next(err);
    }
  }

  async explorePath(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      const { rootServiceId, targetServiceId } = req.query as { rootServiceId: string; targetServiceId: string };
      const result = await dependencyService.explorePath(rootServiceId, targetServiceId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
