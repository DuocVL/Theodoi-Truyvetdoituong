
import { Router } from 'express';
import authRoutes from './auth/auth.route';
import userRoutes from './auth/user.route';
import SubjectRoute from '../subjects.route';
import ZoneRoute from '../zones.route'; // Import the new ZoneRoute
import logRoutes from './log.route';
import trackingRoutes from './tracking.route';

const router = Router();

// Create instances of the routes
const subjectRoute = new SubjectRoute();
const zoneRoute = new ZoneRoute(); // Create an instance for ZoneRoute

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use(subjectRoute.path, subjectRoute.router);
router.use(zoneRoute.path, zoneRoute.router); // Use the new ZoneRoute
router.use('/logs', logRoutes);
router.use('/tracking', trackingRoutes);

export default router;
