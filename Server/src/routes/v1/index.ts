
import { Router } from 'express';
import authRoutes from './auth.route';
import UserRoute from './users.route'; 
import SubjectRoute from './subjects.route';
import ZoneRoute from './zones.route';
import logRoutes from './log.route';
import FaceRoute from './face.route';
import imageRouter from './image.route'; 
import CheckinRoute from './checkin.route';
import alertRoute from './alerts.route';
import locationRoute from './location.route'

//Khởi tạo router định tuyến API
const router = Router();

//Khởi tạo các thể hiện từ các class Route
const userRoute = new UserRoute();
const subjectRoute = new SubjectRoute();
const zoneRoute = new ZoneRoute();

//Xác thực người dùng
router.use('/auth', authRoutes);

// Quản lý cán bộ hệ thống
router.use(userRoute.path, userRoute.router); 

// Quản lý hồ sơ đối tượng
router.use(subjectRoute.path, subjectRoute.router);

// Quản lý vùng địa lý/khu vực giám sát
router.use(zoneRoute.path, zoneRoute.router);

// Truy xuất nhật ký/audit logs
router.use('/logs', logRoutes);
// Xử lý nhận diện/đăng ký khuôn mặt

//Quản lý dữ liệu khuôn mặt
router.use('/face', FaceRoute);

//Quản lý xử lý ảnh
router.use('/images', imageRouter);

//Quản lý xử lý checkins
router.use('/checkins', CheckinRoute);

//Quản lý xử lý cảnh báo
router.use('/alerts', alertRoute)

//Quản lý xử lý vị trí 
router.use('/locations', locationRoute)


export default router;
