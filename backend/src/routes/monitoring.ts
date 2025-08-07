import { Router } from 'express';
import { MetricsService } from '../services/MetricsService';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Prometheus metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await MetricsService.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    res.status(500).send('Error collecting metrics');
  }
});

// Application health metrics (authenticated)
router.get(
  '/health-metrics',
  authenticate,
  authorize(['admin']),
  async (req, res, next) => {
    try {
      const metrics = await MetricsService.getHealthMetrics();
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as monitoringRouter };