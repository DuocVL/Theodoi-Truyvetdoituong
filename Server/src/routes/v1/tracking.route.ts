import { Router } from 'express';
import trackingController from '../../controllers/tracking.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/rbac.middleware'; // Import the new RBAC middleware
import { UserAccountRole } from '../../../generated/prisma/client'; // Import the Role enum


const router = Router();

// All tracking routes require authentication and are accessible by ADMIN and USER roles.
router.use(authMiddleware, checkRole([
  UserAccountRole.ADMIN,
  UserAccountRole.USER
]));

// Get aggregated tracking data for all subjects
router.get('/', trackingController.getAll);

// Get the movement history for a specific subject
router.get('/history/:subjectId', trackingController.getCheckinHistory);

// Get the last known location of a subject
router.get('/last-location/:subjectId', trackingController.getLastLocation);

export default router;
