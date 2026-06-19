
import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import { authMiddleware } from '@/middlewares/auth.middleware';

// Import các thành phần của module
import { FaceController } from '@/controllers/face.controller';
import { FaceService } from '@/services/face.service';
import { FaceRepository } from '@/repositories/face.repository';

// Middleware cho file upload
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { files: 5, fileSize: 10 * 1024 * 1024 } });

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
     *     summary: Đăng ký khuôn mặt cho subject hiện tại
     *     tags: [Face]
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               files:
     *                 type: array
     *                 items:
     *                   type: string
     *                   format: binary
     *     responses:
     *       201: { description: 'Đăng ký thành công' }
     */
    this.router.post(
      `${this.path}/register`,
      upload.array('files', 5),
      this.controller.register,
    );

    /**
     * @openapi
     * /face/subject/{subjectId}:
     *   get:
     *     summary: Lấy tất cả dữ liệu khuôn mặt của một subject
     *     tags: [Face]
     *     parameters:
     *       - in: path
     *         name: subjectId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200: { description: 'Thành công' }
     */
    this.router.get(
      `${this.path}/me`,
      this.controller.getFaceData,
    );
  }
}
