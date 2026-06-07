import { Router } from 'express';
import * as logController from '../../controllers/log.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';

const router = Router();

// Chặn truy cập: Chỉ những tài khoản có quyền ADMIN mới được phép xem nhật ký hệ thống
router.use(authMiddleware, authorize(['ADMIN']));

// Lấy nhật ký các yêu cầu API (Ai gọi API nào, lúc nào, thành công hay không)
router.get('/request', logController.getRequestLogs);
// Lấy nhật ký các sự kiện đăng nhập, thay đổi mật khẩu
router.get('/auth', logController.getAuthLogs);
// Lấy nhật ký các sự kiện hoặc lỗi phát sinh từ hệ thống (Server, Database, Worker)
router.get('/system', logController.getSystemLogs);

export default router;
