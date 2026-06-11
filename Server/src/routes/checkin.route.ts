
import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import { validationMiddleware } from '@/middlewares/validation.middleware';

// Import các thành phần cần thiết
import { CheckinController } from '@/controllers/checkin.controller';
import { CheckinService } from '@/services/checkin.service';
import { CheckinRepository } from '@/repositories/checkin.repository';
import { ImageService } from '@/services/image.service';
import { FaceService } from '@/services/face.service';
import { CreateCheckinDto } from '@/dtos/checkin.dto';

// Middleware để xử lý file upload. 
// LƯU Ý: Bạn cần cài đặt `express-fileupload` bằng `npm install express-fileupload`
import fileUpload from 'express-fileupload';

export class CheckinRoute implements Routes {
  public path = '/checkins';
  public router = Router();

  // --- CẬP NHẬT COMPOSITION ROOT ---
  // 1. Khởi tạo tất cả các repository và service cần thiết
  private readonly checkinRepository = new CheckinRepository();
  private readonly imageService = new ImageService();
  private readonly faceService = new FaceService();

  // 2. Tiêm tất cả dependency vào CheckinService
  private readonly checkinService = new CheckinService(
    this.checkinRepository,
    this.imageService,
    this.faceService,
  );

  // 3. Tiêm CheckinService vào Controller
  public controller = new CheckinController(this.checkinService);

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // --- CẬP NHẬT ROUTE TẠO MỚI ---
    this.router.post(
      `${this.path}`,
      // Middleware 1: Xử lý multipart/form-data
      fileUpload(),
      // Middleware 2: Validate các trường trong `req.body`
      validationMiddleware(CreateCheckinDto, 'body'),
      // Handler của Controller
      this.controller.createCheckin,
    );

    // --- CÁC ROUTE KHÁC GIỮ NGUYÊN ---
    this.router.get(`${this.path}/:id`, this.controller.getCheckinById);
    this.router.get(`${this.path}/subject/:subjectId`, this.controller.getCheckinsBySubject);
    // ... update, delete ...
  }
}
