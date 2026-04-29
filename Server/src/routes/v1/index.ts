
import { Router } from 'express';
import authRoutes from './auth/auth.route';
import userRoutes from './auth/user.route';
import SubjectRoute from './subjects.route'; // Corrected import
import logRoutes from './log.route';
import trackingRoutes from './tracking.route';

const router = Router();
const subjectRoute = new SubjectRoute();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use(subjectRoute.path, subjectRoute.router); // Use the new subject route
router.use('/logs', logRoutes);
router.use('/tracking', trackingRoutes);

export default router;
