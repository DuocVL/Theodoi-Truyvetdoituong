
/**
 * @file checkin.controller.ts
 * @description Controller xử lý các request HTTP cho module Checkin.
 */

import { NextFunction, Response } from 'express';
import { CheckinService } from '../services/checkin.service';
import { RequestWithUser } from '../types/data'; // Đảm bảo interface này được định nghĩa đúng
import { CreateCheckinDto, UpdateCheckinDto } from '../dtos/checkin.dto';
import { HttpException } from '../exceptions/http-exception';
import { UploadedFile } from 'express-fileupload';

export class CheckinController {
  private checkinService = new CheckinService();

  public createCheckin = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      if (!accountId) throw new HttpException(401, 'Unauthorized');

      const imageFile = req.file
      if (!imageFile) {
        throw new HttpException(400, 'Image file is missing');
      }
      
      const checkinData: CreateCheckinDto = req.body;

      const newCheckin = await this.checkinService.createCheckin(accountId, checkinData, imageFile);

      res.status(201).json({ data: newCheckin, message: 'Check-in created successfully' });
    } catch (error) {
      next(error);
    }
  };

  // FIX: Sử dụng RequestWithUser để đảm bảo có req.params
  public getCheckinById = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const checkinId = req.params.id as string;
      const checkin = await this.checkinService.getCheckinById(checkinId);
      res.status(200).json({ data: checkin });
    } catch (error) {
      next(error);
    }
  };

  // FIX: Sử dụng RequestWithUser để đảm bảo có req.params
  public getCheckinsBySubject = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subjectId = req.params.subjectId as string;
      const checkins = await this.checkinService.getCheckinsBySubjectId(subjectId);
      res.status(200).json({ data: checkins });
    } catch (error) {
      next(error);
    }
  };

  public updateCheckin = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      if (!accountId) throw new HttpException(401, 'Unauthorized');

      const checkinId = req.params.id as string;
      const updateData: UpdateCheckinDto = req.body;

      const updatedCheckin = await this.checkinService.updateCheckinNotes(accountId, checkinId, updateData);

      res.status(200).json({ data: updatedCheckin, message: 'Check-in updated successfully' });
    } catch (error) {
      next(error);
    }
  };
}
