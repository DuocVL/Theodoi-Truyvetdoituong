import { Router } from 'express';
import * as logController from '../../controllers/log.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/rbac.middleware';
import { UserAccountRole } from '../../../generated/prisma';

const router = Router();

// All log routes are protected and restricted to ADMINs.
router.use(authMiddleware, checkRole([UserAccountRole.ADMIN]));

// Route to get API request logs
router.get('/request', logController.getRequestLogs);

// Route to get authentication-related logs
router.get('/auth', logController.getAuthLogs);

// Route to get system-level event or error logs
router.get('/system', logController.getSystemLogs);

export default router;
