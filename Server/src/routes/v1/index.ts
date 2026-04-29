import { Router } from 'express';
import authRoutes from './auth/auth.route';
import userRoutes from './auth/user.route';
import subjectRoutes from './auth/subject.route';
import logRoutes from './log.route';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/subjects', subjectRoutes);
router.use('/logs', logRoutes);

export default router;
