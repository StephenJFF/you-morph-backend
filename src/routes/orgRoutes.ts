import { Router } from 'express';
import * as orgController from '../controllers/orgController';

const router = Router();

router.get('/', orgController.getAllOrgs);
router.get('/:id', orgController.getOrgById);
router.post('/', orgController.createOrg);
router.put('/:id', orgController.updateOrg);
router.delete('/:id', orgController.deleteOrg);

export default router;
