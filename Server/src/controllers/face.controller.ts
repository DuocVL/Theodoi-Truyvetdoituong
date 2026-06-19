
import { NextFunction, Response } from 'express';
import { FaceService } from '@/services/face.service';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { HttpException } from '@/exceptions/http-exception';
import { prisma } from '@/configs/prisma';

export class FaceController {
  constructor(private readonly faceService: FaceService) {}

  /**
   * Đăng ký khuôn mặt cho subject.
   */
  public register = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      const accountId = req.account?.id;

      if (!accountId) throw new HttpException(401, 'Unauthorized');

      const subject = await prisma.subject.findUnique({ where: { account_id: accountId } });
      if (!subject) throw new HttpException(403, 'Forbidden: User is not a subject');

      const newFaceData = await this.faceService.registerFace(subject.id, files);

      res.status(201).json({ 
        message: 'Face registered successfully.',
        data: newFaceData,
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * Lấy tất cả dữ liệu khuôn mặt của một subject.
   */
  public getFaceData = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Lấy subjectId từ params của route
      const { subjectId } = req.params;
      if (!subjectId) throw new HttpException(400, 'Bad Request: Missing subjectId parameter');

      const faceData = await this.faceService.getFaceDataForSubject(subjectId);

      res.status(200).json({ data: faceData });

    } catch (error) {
      next(error);
    }
  };

  // Phương thức `checkIn` đã được chuyển sang `CheckinController`
  // và sẽ được xử lý bất đồng bộ qua hàng đợi, nên sẽ không có ở đây.
}
