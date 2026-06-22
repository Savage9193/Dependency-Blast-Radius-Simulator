import { HealthService, AnalyticsService } from '../services/health.service';

const healthService = new HealthService();
const analyticsService = new AnalyticsService();

export class HealthController {
  async getDashboard(_req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      const dashboard = await healthService.getDashboard();
      res.json(dashboard);
    } catch (err) {
      next(err);
    }
  }

  async getAnalytics(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
    try {
      const days = Number(req.query.days) || 30;
      const trends = await analyticsService.getTrends(days);
      res.json(trends);
    } catch (err) {
      next(err);
    }
  }
}
