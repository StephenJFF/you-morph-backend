import { Router } from 'express';
import * as checkinController from '../controllers/checkinController';
import { verifyClientAccess } from '../utils/authMiddleware';

const router = Router();

router.post('/', verifyClientAccess(16), checkinController.createCheckin);
router.get('/:user_id', verifyClientAccess(2 | 16), checkinController.getCheckinsByUserId);

export default router;
