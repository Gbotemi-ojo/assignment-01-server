import { Router } from 'express';
import { getInspections, getStats, getHealthCheck } from '../controllers/sheetController';

const router = Router();

// Routes
router.get('/health', getHealthCheck);
router.get('/inspections', getInspections);
router.get('/inspections/stats', getStats);

// Alias endpoints for convenience
router.get('/data', getInspections);
router.get('/stats', getStats);

export default router;
