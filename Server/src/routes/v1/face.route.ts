
/**
 * @file face.route.ts
 * @description Định nghĩa các API endpoints cho module Face.
 */

import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware'; 
import { FaceController } from '../../controllers/face.controller';
import { registerFaceSchema } from '../../dtos/face.dto';

// Khởi tạo router và controller
const router = Router();
const faceController = new FaceController();

// Áp dụng middleware xác thực cho tất cả các route bên dưới
router.use(authMiddleware);

// Định nghĩa các routes
router.post(
  '/register',
  validate(registerFaceSchema),
  faceController.register,
);

router.get(
  '/me',
  faceController.getMyFaceData,
);

export default router;
