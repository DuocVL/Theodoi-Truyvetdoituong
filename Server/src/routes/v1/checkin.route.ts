
/**
 * @file checkin.route.ts
 * @description Định nghĩa các API endpoints cho module Checkin.
 */

import { Router } from 'express';
import { CheckinController } from '../../controllers/checkin.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createCheckinSchema, updateCheckinSchema } from '../../dtos/checkin.dto';
import upload from '../../middlewares/upload.middleware';

const router = Router();
const checkinController = new CheckinController();

// Tất cả các route trong file này đều yêu cầu xác thực
router.use(authMiddleware);

// Lấy danh sách check-in của chính subject đang đăng nhập (có phân trang)
router.get('/me', checkinController.getMyCheckins);

// Mới: Lấy danh sách check-in từ các subject mà USER đang quản lý (có phân trang)
router.get('/user', checkinController.getUserManagedCheckins);

// Tạo mới một check-in
router.post('/', upload.single('image'), validate(createCheckinSchema), checkinController.createCheckin);

// Lấy check-in theo ID (route này nên đặt sau các route tĩnh khác)
router.get('/:id', checkinController.getCheckinById);

// Cập nhật: Lấy check-in theo subjectId với quyền và phân trang
router.get('/subject/:subjectId', checkinController.getCheckinsBySubject);

// Cập nhật một check-in
router.patch('/:id', validate(updateCheckinSchema), checkinController.updateCheckin);

export default router;

