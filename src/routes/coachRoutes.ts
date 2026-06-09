import { Router } from 'express';
import * as coachController from '../controllers/coachController';
import { authorizeRole } from '../utils/authMiddleware';

const router = Router();

router.get('/', coachController.getAllCoaches);
router.post('/', coachController.createCoach);

// Coach-specific endpoints
router.get('/clients', authorizeRole(['coach']), coachController.getCoachClients);
router.post('/invite', authorizeRole(['coach']), coachController.inviteClient);
router.put('/clients/:clientId/permissions', authorizeRole(['coach']), coachController.updateClientPermissions);

export default router;
