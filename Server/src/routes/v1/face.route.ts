import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware'; 
import { FaceController } from '../../controllers/face.controller';
import { registerFaceSchema } from '../../dtos/face.dto';

// Khởi tạo router và controller
const router = Router();
const faceController = new FaceController();

// Áp dụng middleware xác thực
router.use(authMiddleware);

// Định nghĩa các routes
router.post( '/register', validate(registerFaceSchema), faceController.register);

//lấy bản ghi facedata của subject
router.get('/me', faceController.getMyFaceData);

export default router;
