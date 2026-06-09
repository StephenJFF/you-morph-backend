import { Router } from 'express';
import * as userController from '../controllers/userController';
import { verifyClientAccess } from '../utils/authMiddleware';

const router = Router();

router.get('/', userController.getAllUsers);

// Invitation endpoints (must be before :id to avoid conflict)
router.get('/invitations', userController.getUserInvitations);
router.post('/invitations/:invitationId/respond', userController.respondToInvitation);

router.get('/:id', verifyClientAccess(1), userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', verifyClientAccess(8), userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
