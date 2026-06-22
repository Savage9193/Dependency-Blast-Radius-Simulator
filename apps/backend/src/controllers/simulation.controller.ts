import { SimulationService } from '../services/simulation.service';
import { getParam } from '../utils/params';

const simulationService = new SimulationService();

export class SimulationController {
  async run(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      const result = await simulationService.runSimulation(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async rerun(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      const result = await simulationService.rerun(getParam(req.params.id));
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      const result = await simulationService.getWithDetails(getParam(req.params.id));
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const result = await simulationService.getHistory(page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async compare(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      const result = await simulationService.compare(req.body.simulationIds);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
