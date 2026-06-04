
import { Router } from 'express';
import trackingController from '../../controllers/tracking.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

// Middleware to protect all tracking routes
router.use(authMiddleware);

// Route to get all tracking logs for the main dashboard view
router.get('/', trackingController.getAll);

// Get check-in history for a specific subject within a time range
router.get('/history/:subjectId', trackingController.getCheckinHistory);

// Get the last known location of a specific subject
router.get('/last-location/:subjectId', trackingController.getLastLocation);

export default router;
