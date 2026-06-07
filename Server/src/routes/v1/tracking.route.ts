import { Router } from 'express';
import trackingController from '../../controllers/tracking.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/rbac.middleware'; // Import the new RBAC middleware
import { UserAccountRole } from '../../../generated/prisma'; // Import the Role enum

const router = Router();

// All tracking routes require authentication and a specific user role.
router.use(authMiddleware, checkRole([
  UserAccountRole.ADMIN,
  UserAccountRole.MANAGER,
  UserAccountRole.OPERATOR
]));

// Get aggregated tracking data for all subjects (for the main map)
router.get('/', trackingController.getAll);

// Get the check-in/movement history for a specific subject
router.get('/history/:subjectId', trackingController.getCheckinHistory);

// Get the last known location of a subject for real-time monitoring
router.get('/last-location/:subjectId', trackingController.getLastLocation);

export default router;
