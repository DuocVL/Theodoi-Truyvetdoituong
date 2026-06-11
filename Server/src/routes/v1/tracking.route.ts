import { Router } from 'express';
import trackingController from '../../controllers/tracking.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';


const router = Router();

// All tracking routes require authentication and are accessible by ADMIN and USER roles.
router.use(authMiddleware);

// Get aggregated tracking data for all subjects
router.get('/', trackingController.getAll);

// Get details of a specific check-in record
router.get('/checkin/:id', trackingController.getById);

// Get the movement history for a specific subject
router.get('/history/:subjectId', trackingController.getCheckinHistory);

// Get the last known location of a subject
router.get('/last-location/:subjectId', trackingController.getLastLocation);

export default router;
