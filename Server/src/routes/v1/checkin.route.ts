
/**
 * @file checkin.route.ts
 * @description Định nghĩa các API endpoints cho module Checkin theo kiến trúc mới.
 */

import { Router } from 'express';
import { Routes } from '../../interfaces/routes.interface';
import { authMiddleware } from '../../middlewares/auth.middleware';
// FIX: Đổi tên validate thành validationMiddleware cho nhất quán
import { validationMiddleware } from '../../middlewares/validation.middleware';
import { createCheckinSchema, updateCheckinSchema } from '../../dtos/checkin.dto';
import { CheckinController } from '../../controllers/checkin.controller';
import fileUpload from 'express-fileupload';

export class CheckinRoute implements Routes {
  public path = '/checkins';
  public router = Router();
  public controller = new CheckinController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Áp dụng middleware xác thực cho tất cả các route của checkin
    // FIX: authMiddleware cần được áp dụng cho từng route để không xung đột với path
    this.router.post(
      this.path,
      authMiddleware, // Áp dụng auth
      fileUpload(),
      // Middleware xác thực các trường text
      validationMiddleware(createCheckinSchema, 'body'), 
      this.controller.createCheckin
    );

    this.router.get(
      `${this.path}/:id`,
      authMiddleware, // Áp dụng auth
      this.controller.getCheckinById
    );

    this.router.get(
      `${this.path}/subject/:subjectId`,
      authMiddleware, // Áp dụng auth
      this.controller.getCheckinsBySubject
    );

    this.router.patch(
      `${this.path}/:id`,
      authMiddleware, // Áp dụng auth
      validationMiddleware(updateCheckinSchema, 'body'),
      this.controller.updateCheckin
    );
  }
}

