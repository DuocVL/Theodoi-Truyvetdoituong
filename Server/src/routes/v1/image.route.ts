
import { Router } from 'express';
import { ImageController } from '../../controllers/image.controller';
import upload from '../../middlewares/upload.middleware';
import { authMiddleware } from '../..//middlewares/auth.middleware';

const router = Router();
const imageController = new ImageController();

//Áp dụng middleware xác thực 
router.use(authMiddleware);

//Tải lên 1 hình ảnh 
router.post('/', upload.single('image'), imageController.uploadImage);

//Lấy thông tin chi tiết 1 ảnh qua id
router.get('/:id', imageController.getImageById);

//Xóa bỏ hình ảnh
router.delete('/:id', imageController.deleteImageById);

export default router;
