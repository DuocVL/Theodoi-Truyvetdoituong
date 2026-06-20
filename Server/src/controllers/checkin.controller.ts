
/**
 * @file checkin.controller.ts
 * @description Controller xử lý các request HTTP cho module Checkin.
 */

import { NextFunction, Response } from 'express';
import { CheckinService } from '../services/checkin.service';
import { RequestWithUser } from '../types/data';
import { CreateCheckinDto, UpdateCheckinDto } from '../dtos/checkin.dto';
import { HttpException } from '../exceptions/http-exception';
import type { UploadedFile } from 'express-fileupload';

export class CheckinController {
  // Controller tự khởi tạo Service
  private checkinService = new CheckinService();

  /**
   * @method POST /checkins
   * @description Handler tạo mới một check-in.
   */
  public createCheckin = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      if (!accountId) throw new HttpException(401, 'Unauthorized');

      if (!req.files || !req.files.image) {
        throw new HttpException(400, 'Image file is missing');
      }
      const imageFile = req.files.image as UploadedFile;
      const checkinData: CreateCheckinDto = req.body;

      const newCheckin = await this.checkinService.createCheckin(accountId, checkinData, imageFile);

      res.status(201).json({ data: newCheckin, message: 'Check-in created successfully' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @method GET /checkins/:id
   * @description Handler lấy một check-in bằng ID.
   */
  public getCheckinById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const checkinId = req.params.id;
      const checkin = await this.checkinService.getCheckinById(checkinId);
      res.status(200).json({ data: checkin });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @method GET /checkins/subject/:subjectId
   * @description Handler lấy tất cả check-in của một subject.
   */
  public getCheckinsBySubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subjectId = req.params.subjectId;
      const checkins = await this.checkinService.getCheckinsBySubjectId(subjectId);
      res.status(200).json({ data: checkins });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @method PATCH /checkins/:id
   * @description Handler cập nhật notes của một check-in.
   */
  public updateCheckin = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      if (!accountId) throw new HttpException(401, 'Unauthorized');

      const checkinId = req.params.id;
      const updateData: UpdateCheckinDto = req.body;

      const updatedCheckin = await this.checkinService.updateCheckinNotes(accountId, checkinId, updateData);

      res.status(200).json({ data: updatedCheckin, message: 'Check-in updated successfully' });
    } catch (error) {
      next(error);
    }
  };
}
