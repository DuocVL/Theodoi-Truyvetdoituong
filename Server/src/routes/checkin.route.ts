
/**
 * @file checkin.route.ts
 * @description Định nghĩa các API endpoints cho module Checkin theo kiến trúc mới.
 */

import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { validationMiddleware } from '@/middlewares/validation.middleware'; // Đảm bảo bạn dùng middleware validation đã hỗ trợ Zod
import { createCheckinSchema, updateCheckinSchema } from '@/dtos/checkin.dto';
import { CheckinController } from '@/controllers/checkin.controller';
import fileUpload from 'express-fileupload';

export class CheckinRoute implements Routes {
  public path = '/checkins';
  public router = Router();
  // Route chỉ cần khởi tạo Controller
  public controller = new CheckinController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Áp dụng middleware xác thực cho tất cả các route của checkin
    this.router.use(this.path, authMiddleware);

    // Route tạo mới check-in (dùng multipart/form-data)
    this.router.post(
      `${this.path}`,
      fileUpload(), // Middleware xử lý file upload, đặt trước validation
      validationMiddleware(createCheckinSchema, 'body'), // Middleware xác thực các trường text
      this.controller.createCheckin,
    );

    // Route lấy check-in theo ID
    this.router.get(
      `${this.path}/:id`,
      this.controller.getCheckinById,
    );

    // Route lấy tất cả check-in của một subject
    this.router.get(
      `${this.path}/subject/:subjectId`,
      this.controller.getCheckinsBySubject,
    );

    // Route cập nhật ghi chú của một check-in
    this.router.patch(
      `${this.path}/:id`,
      validationMiddleware(updateCheckinSchema, 'body'),
      this.controller.updateCheckin,
    );
  }
}
