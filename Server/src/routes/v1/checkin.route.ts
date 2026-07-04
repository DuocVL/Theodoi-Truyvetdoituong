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

// Lấy danh sách check-in của chính subject đang đăng nhập
router.get('/me', checkinController.getMyCheckins);

//Lấy danh sách check-in từ các subject mà USER đang quản lý
router.get('/user', checkinController.getUserManagedCheckins);
//Lọc theo thời gian
router.get('/user/time-filter', checkinController.getUserManagedCheckinsByTime);

// Cập nhật: Lấy check-in theo subjectId với quyền và phân trang
router.get('/subject/:subjectId', checkinController.getCheckinsBySubject);
//Lọc checkin subject theo thời gian
router.get('/subject/:subjectId/time-filter', checkinController.getCheckinsBySubjectAndTime);


//Lấy báo cáo file xlsx
router.get('/export', checkinController.exportReport)

// Tạo mới một check-in
router.post('/', upload.single('image'), validate(createCheckinSchema), checkinController.createCheckin);


// Lấy check-in theo ID
router.get('/:id', checkinController.getCheckinById);
// Cập nhật một check-in
router.patch('/:id', validate(updateCheckinSchema), checkinController.updateCheckin);



export default router;