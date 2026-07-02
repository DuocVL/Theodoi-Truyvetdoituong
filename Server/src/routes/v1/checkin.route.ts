/**
 * @file checkin.route.ts
 * @description Định nghĩa các API endpoints cho module Checkin.
 */

import { Router } from 'express';
import { CheckinController } from '../../controllers/checkin.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createCheckinSchema, updateCheckinSchema } from '../../dtos/checkin.dto'; // Đã bỏ checkinTimeFilterSchema
import upload from '../../middlewares/upload.middleware';

const router = Router();
const checkinController = new CheckinController();

// Tất cả các route trong file này đều yêu cầu xác thực
router.use(authMiddleware);

// Đọc trực tiếp từ query trong controller, không đi qua middleware validate nữa
router.get('/user/time-filter', checkinController.getUserManagedCheckinsByTime);
router.get('/subject/:subjectId/time-filter', checkinController.getCheckinsBySubjectAndTime);

// Lấy danh sách check-in của chính subject đang đăng nhập (có phân trang)
router.get('/me', checkinController.getMyCheckins);

router.get('/export', checkinController.exportReport)

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