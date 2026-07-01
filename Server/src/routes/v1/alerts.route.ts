import { Router } from 'express';
import * as controller from '../../controllers/alerts.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);//midddlewaare xác thực , xác định quyền

// Lấy danh sách alert cho Admin/User quản lý
router.get('/', controller.getAlertsHandler);

//Lấy chi tiết thông tin 
router.get('/:id', controller.getAlertDetailController);

// Lấy danh sách alert cho chính Subject đó
router.get('/me', controller.getAlertsHandler); 

export default router;