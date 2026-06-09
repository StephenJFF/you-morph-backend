import { Router } from 'express';
import * as brandingController from '../controllers/brandingController';

const router = Router();

router.get('/:owner_id', brandingController.getBrandingByOwnerId);
router.post('/', brandingController.upsertBranding);

export default router;
