
import { Router } from 'express';
import trackingController from '../../controllers/tracking.controller';
import { auth, checkRole } from '../../middlewares/auth.middleware';

const router = Router();

// Get check-in history for a subject
router.get(
  '/history/:subjectId',
  auth,
  checkRole(['admin', 'manager']),
  trackingController.getCheckinHistory
);

// Get the last known location of a subject
router.get(
  '/last-location/:subjectId',
  auth,
  checkRole(['admin', 'manager']),
  trackingController.getLastLocation
);

export default router;
