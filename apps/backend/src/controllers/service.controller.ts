import { ServiceFilterInput } from '@dbrs/shared';
import { ServiceService } from '../services/service.service';
import { getParam } from '../utils/params';


const serviceService = new ServiceService();

export class ServiceController {
  async create(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      const service = await serviceService.create(req.body);
      res.status(201).json(service);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      const service = await serviceService.getByIdWithCounts(getParam(req.params.id));
      res.json(service);
    } catch (err) {
      next(err);
    }
  }

  async update(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      const service = await serviceService.update(getParam(req.params.id), req.body);
      res.json(service);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      await serviceService.delete(getParam(req.params.id));
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  async list(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      const query = (req as any).validatedQuery;
      const result = await serviceService.list(query as ServiceFilterInput);
      res.json(result);
    } catch (err) {
        next(err);
      }
    }
  }
