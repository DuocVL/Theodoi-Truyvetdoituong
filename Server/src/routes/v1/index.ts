
import { Router , static as static_ } from 'express';
import authRoutes from './auth.route';
import UserRoute from './users.route'; // Corrected import
import SubjectRoute from './subjects.route';
import ZoneRoute from './zones.route';
import logRoutes from './log.route';
import trackingRoutes from './tracking.route';
import FaceRoute from './face.route';
import imageRouter from './image.route'; // Import the new image router
import CheckinRoute from './checkin.route';

const router = Router();

// Create instances of the routes
const userRoute = new UserRoute();
const subjectRoute = new SubjectRoute();
const zoneRoute = new ZoneRoute();

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
router.use('/face', FaceRoute);

// Add the image routes
router.use('/images', imageRouter);

router.use('/checkins', CheckinRoute);


export default router;
