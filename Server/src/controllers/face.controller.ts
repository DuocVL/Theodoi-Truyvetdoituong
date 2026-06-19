
/**
 * @file face.controller.ts
 * @description
 * Lớp Controller chịu trách nhiệm xử lý các request HTTP đến từ client cho module Face.
 * Nó nhận dữ liệu từ request, gọi đến FaceService để thực hiện các nghiệp vụ chính,
 * và trả về response (dữ liệu hoặc lỗi) cho client.
 */

import { NextFunction, Response } from 'express';
import { FaceService } from '../services/face.service';
import { RequestWithUser } from '../types/data';
import { HttpException } from '../exceptions/http-exception';
import { prisma } from '../configs/prisma';
// Import kiểu dữ liệu DTO được suy ra từ Zod schema
import { RegisterFaceDto } from '../dtos/face.dto';

export class FaceController {
  constructor(private readonly faceService: FaceService) {}

  /**
   * @method POST /face/register
   * @description Handler để đăng ký một embedding khuôn mặt mới cho người dùng đang đăng nhập.
   */
  public register = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const accountId = req.account?.id;
      // Dữ liệu đã được xác thực bởi Zod middleware, giờ đây nó có kiểu RegisterFaceDto
      const registerData: RegisterFaceDto = req.body;

      if (!accountId) throw new HttpException(401, 'Unauthorized');

      const subject = await prisma.subject.findUnique({ where: { account_id: accountId } });
      if (!subject) throw new HttpException(403, 'Forbidden: User is not a subject');

      const newFaceData = await this.faceService.registerFace(subject.id, registerData.embedding);

      res.status(201).json({ 
        message: 'Face registered successfully.',
        data: newFaceData,
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * @method GET /face/me
   * @description Handler để lấy tất cả dữ liệu khuôn mặt của người dùng đang đăng nhập.
   */
  public getMyFaceData = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const accountId = req.account?.id;
      if (!accountId) throw new HttpException(401, 'Unauthorized');

      const subject = await prisma.subject.findUnique({ where: { account_id: accountId } });
      if (!subject) throw new HttpException(403, 'Forbidden: User is not a subject');

      const faceData = await this.faceService.getFaceDataForSubject(subject.id);

      res.status(200).json({ data: faceData });

    } catch (error) {
      next(error);
    }
  };
}
