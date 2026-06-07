import { Router } from 'express';
import * as logController from '../../controllers/log.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/rbac.middleware'; // Import the new RBAC middleware
import { UserAccountRole } from '../../../generated/prisma'; // Import the Role enum

const router = Router();

// Protect all log routes, only ADMINs can access them.
router.use(authMiddleware, checkRole([UserAccountRole.ADMIN]));

// Route to get API request logs
router.get('/request', logController.getRequestLogs);

// Route to get authentication-related logs (login, password changes, etc.)
router.get('/auth', logController.getAuthLogs);

// Route to get system-level event or error logs
router.get('/system', logController.getSystemLogs);

export default router;
