
import { Router } from 'express';
import trackingController from '../../controllers/tracking.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

// Đảm bảo người dùng phải đăng nhập mới có thể truy cập dữ liệu truy vết
router.use(authMiddleware);

// Lấy dữ liệu truy vết tổng hợp của tất cả đối tượng (dùng cho bản đồ trung tâm)
router.get('/', trackingController.getAll);

// Truy xuất lịch sử di chuyển/điểm danh của một đối tượng nhất định
router.get('/history/:subjectId', trackingController.getCheckinHistory);

// Lấy vị trí ghi nhận mới nhất của đối tượng (Real-time monitor)
router.get('/last-location/:subjectId', trackingController.getLastLocation);

export default router;
