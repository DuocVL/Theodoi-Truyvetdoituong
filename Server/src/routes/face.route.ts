
import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { validationMiddleware } from '@/middlewares/validation.middleware';

// Import các thành phần của module
import { FaceController } from '@/controllers/face.controller';
import { FaceService } from '@/services/face.service';
import { FaceRepository } from '@/repositories/face.repository';
import { RegisterFaceDto } from '@/dtos/face.dto';

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
    // Áp dụng auth middleware cho tất cả các route bên dưới
    this.router.use(authMiddleware);

    /**
     * @openapi
     * /face/register:
     *   post:
     *     summary: Đăng ký khuôn mặt bằng vector embedding
     *     tags: [Face]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RegisterFaceDto'
     *     responses:
     *       201: { description: 'Đăng ký thành công' }
     */
    this.router.post(
      `${this.path}/register`,
      // Loại bỏ multer, thay bằng validation cho body
      validationMiddleware(RegisterFaceDto, 'body'),
      this.controller.register,
    );

    /**
     * @openapi
     * /face/me:
     *   get:
     *     summary: Lấy tất cả dữ liệu khuôn mặt của user đang đăng nhập
     *     tags: [Face]
     *     responses:
     *       200: { description: 'Thành công' }
     */
    this.router.get(
      `${this.path}/me`,
      this.controller.getMyFaceData,
    );
  }
}

// Thêm định nghĩa schema cho Swagger (nếu bạn dùng)
/**
 * @openapi
 * components:
 *   schemas:
 *     RegisterFaceDto:
 *       type: object
 *       required:
 *         - embedding
 *       properties:
 *         embedding:
 *           type: array
 *           items:
 *             type: number
 *           description: Vector embedding của khuôn mặt.
 *           example: [0.1, 0.2, ..., -0.5]
 */
