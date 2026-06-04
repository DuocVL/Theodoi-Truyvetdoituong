import { Router } from 'express';
import * as logController from '../../controllers/log.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';

const router = Router();

// All log routes are protected and require admin privileges
router.use(authMiddleware, authorize(['ADMIN']));

router.get('/request', logController.getRequestLogs);
router.get('/auth', logController.getAuthLogs);
router.get('/system', logController.getSystemLogs);

export default router;
