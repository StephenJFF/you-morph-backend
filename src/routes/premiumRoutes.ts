import { Router } from 'express';
import * as premiumController from '../controllers/premiumController';
import { authenticateToken, requirePremium } from '../utils/authMiddleware';

const router = Router();

router.get('/visualization', authenticateToken, requirePremium, premiumController.getAdvancedVisualization);

export default router;
