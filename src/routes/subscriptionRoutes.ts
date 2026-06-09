import { Router } from 'express';
import * as subscriptionController from '../controllers/subscriptionController';
import { authenticateToken } from '../utils/authMiddleware';

const router = Router();

router.post('/checkout', authenticateToken, subscriptionController.checkout);

export default router;
