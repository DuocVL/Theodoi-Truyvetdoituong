
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
// Quản lý cán bộ hệ thống
router.use(userRoute.path, userRoute.router); 
// Quản lý hồ sơ đối tượng
router.use(subjectRoute.path, subjectRoute.router);
// Quản lý vùng địa lý/khu vực giám sát
router.use(zoneRoute.path, zoneRoute.router);
// Truy xuất nhật ký/audit logs
router.use('/logs', logRoutes);
// Truy xuất dữ liệu theo dõi/vị trí
router.use('/tracking', trackingRoutes);
// Xử lý nhận diện/đăng ký khuôn mặt
router.use(faceRoute.path, faceRoute.router);

export default router;
