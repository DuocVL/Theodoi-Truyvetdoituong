
import { NextFunction, Response } from 'express';
import { FaceService } from '@/services/face.service';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { HttpException } from '@/exceptions/http-exception';
import { prisma } from '@/configs/prisma';
import { RegisterFaceDto } from '@/dtos/face.dto';

export class FaceController {
  constructor(private readonly faceService: FaceService) {}

  /**
   * Đăng ký khuôn mặt bằng vector embedding.
   */
  public register = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const accountId = req.account?.id;
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
   * Lấy dữ liệu khuôn mặt của chính user đang đăng nhập.
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
