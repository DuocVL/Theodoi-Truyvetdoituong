
import { Router } from 'express';
import FaceController from '../../controllers/face.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
// No Routes interface – removed

class FaceRoute {
  public path = '/face';
  public router = Router();
  public faceController = new FaceController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * Route đăng ký khuôn mặt mới:
     * 1. authMiddleware: Kiểm tra quyền truy cập.
     * 2. uploadMiddleware: Xử lý file ảnh được gửi lên từ client (thường dùng multer).
     * 3. register: Trích xuất vector khuôn mặt và lưu vào DB.
     */
    this.router.post(
      '/register',
      authMiddleware,
      this.faceController.uploadMiddleware,
      this.faceController.register
    );

    /**
     * Route điểm danh bằng khuôn mặt:
     * So sánh ảnh gửi lên với dữ liệu sinh trắc học đã lưu để xác nhận danh tính/vị trí.
     */
    this.router.post(
      '/check-in',
      authMiddleware,
      this.faceController.uploadMiddleware,
      this.faceController.checkIn
    );
  }
}

export default FaceRoute;
