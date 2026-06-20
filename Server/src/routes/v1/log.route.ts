import { Router } from 'express';
import * as logController from '../../controllers/log.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';// Import the new RBAC middleware
import { UserAccountRole } from '../../../generated/prisma/client'; // Import the Role enum


const router = Router();

// All log routes are protected and restricted to ADMINs.
router.use(authMiddleware);

// Route to get API request logs
router.get('/request', logController.getRequestLogs);

// Route to get authentication-related logs
router.get('/auth', logController.getAuthLogs);

// Route to get system-level event or error logs
router.get('/system', logController.getSystemLogs);

export default router;
