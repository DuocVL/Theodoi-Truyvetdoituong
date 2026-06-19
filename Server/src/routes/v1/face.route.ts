
/**
 * @file face.route.ts
 * @description
 * File này định nghĩa các API endpoints cho module quản lý dữ liệu khuôn mặt (Face).
 * Nó bao gồm các route để đăng ký embedding khuôn mặt và truy xuất thông tin khuôn mặt của người dùng.
 * File này cũng đóng vai trò là "Composition Root" cho module, nơi các dependencies
 * (Repository, Service, Controller) được khởi tạo và tiêm vào nhau theo nguyên tắc Dependency Injection.
 */

import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import { authMiddleware } from '@/middlewares/auth.middleware';
// Giả sử bạn có một middleware mới cho Zod
// import { zodValidationMiddleware } from '@/middlewares/zod.middleware'; 

// Import các thành phần của module
import { FaceController } from '@/controllers/face.controller';
import { FaceService } from '@/services/face.service';
import { FaceRepository } from '@/repositories/face.repository';
import { registerFaceSchema } from '@/dtos/face.dto';

// Placeholder cho middleware Zod, bạn cần thay thế bằng middleware thực tế của mình
// Ví dụ:
// const validationMiddleware = (schema) => (req, res, next) => { ... }; 
// Tôi sẽ sử dụng lại tên `validationMiddleware` để không phá vỡ cấu trúc hiện tại
import { validationMiddleware } from '@/middlewares/validation.middleware';

export class FaceRoute implements Routes {
  public path = '/face';
  public router = Router();

  // --- COMPOSITION ROOT ---
  private readonly repository = new FaceRepository();
  private readonly service = new FaceService(this.repository);
  public controller = new FaceController(this.service);

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(authMiddleware);

    this.router.post(
      `${this.path}/register`,
      // Sử dụng middleware với Zod schema
      // Middleware này sẽ nhận schema và xác thực `req.body`
      validationMiddleware(registerFaceSchema, 'body'), // Giả sử middleware của bạn có thể xử lý Zod
      this.controller.register,
    );

    this.router.get(
      `${this.path}/me`,
      this.controller.getMyFaceData,
    );
  }
}
