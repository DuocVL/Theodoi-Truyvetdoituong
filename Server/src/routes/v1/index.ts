
import { Router } from 'express';
import authRoutes from './auth.route';
import UserRoute from './users.route'; // Corrected import
import SubjectRoute from './subjects.route';
import ZoneRoute from './zones.route';
import logRoutes from './log.route';
import trackingRoutes from './tracking.route';
import FaceRoute from './face.route';

const router = Router();

// Create instances of the routes
const userRoute = new UserRoute();
const subjectRoute = new SubjectRoute();
const zoneRoute = new ZoneRoute();
const faceRoute = new FaceRoute();

router.use('/auth', authRoutes);
router.use(userRoute.path, userRoute.router); // Use the new UserRoute
router.use(subjectRoute.path, subjectRoute.router);
router.use(zoneRoute.path, zoneRoute.router);
router.use('/logs', logRoutes);
router.use('/tracking', trackingRoutes);
router.use(faceRoute.path, faceRoute.router);

export default router;
