
import { NextFunction, Request, Response } from 'express';
import { CheckinService } from '@/services/checkin.service';
import { CreateCheckinDto } from '@/dtos/checkin.dto';
import { Checkin } from '@prisma/client';
import { UploadedFile } from 'express-fileupload';
import { HttpException } from '@/exceptions/http-exception';

export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  public createCheckin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Dữ liệu từ body (form fields)
      const checkinData: CreateCheckinDto = req.body;

      // Dữ liệu embedding (parse từ JSON string)
      if (!req.body.embedding) {
        throw new HttpException(400, 'Missing face embedding data.');
      }
      const embedding = JSON.parse(req.body.embedding);

      // File ảnh từ middleware
      if (!req.files || !req.files.checkinImage) {
        throw new HttpException(400, 'Missing check-in image.');
      }
      const checkinImage = req.files.checkinImage as UploadedFile;
      
      // Gọi service với đầy đủ tham số
      const newCheckin: Checkin = await this.checkinService.createCheckin(
        checkinData,
        checkinImage,
        embedding
      );

      res.status(201).json({ data: newCheckin, message: 'created' });
    } catch (error) {
      next(error);
    }
  };

  // --- CÁC PHƯƠNG THỨC KHÁC GIỮ NGUYÊN ---
  public getCheckinById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const checkinId: string = req.params.id;
      const checkin: Checkin = await this.checkinService.getCheckinById(checkinId);
      res.status(200).json({ data: checkin });
    } catch (error) {
      next(error);
    }
  };

    public getCheckinsBySubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subjectId: string = req.params.subjectId;
      const checkins: Checkin[] = await this.checkinService.getCheckinsBySubject(subjectId);
      res.status(200).json({ data: checkins });
    } catch (error) {
      next(error);
    }
  };
  // ... update và delete giữ nguyên ...
}
