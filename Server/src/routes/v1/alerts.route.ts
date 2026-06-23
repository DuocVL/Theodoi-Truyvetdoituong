import { Router } from 'express';
import * as controller from '../../controllers/alerts.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';// Import the new RBAC middleware

const router = Router();
router.use(authMiddleware);

// Lấy danh sách alert cho Admin/User quản lý
router.get('/', controller.getAlertsHandler);

// Lấy danh sách alert cho chính Subject đó (nếu là role SUBJECT)
router.get('/me', controller.getAlertsHandler); 

// Tạo mới alert (thường do hệ thống tự sinh qua service khác)
// router.post('/', authenticate, authorize(['ADMIN']), controller.create);

export default router;