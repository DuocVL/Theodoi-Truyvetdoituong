
/**
 * @file checkin.controller.ts
 * @description Controller xử lý các request HTTP cho module Checkin.
 */

import { NextFunction, Response } from 'express';
import { CheckinService } from '../services/checkin.service';
import { RequestWithUser } from '../types/data';
import { CreateCheckinDto, UpdateCheckinDto } from '../dtos/checkin.dto';
import { HttpException } from '../exceptions/http-exception';

export class CheckinController {
  private checkinService = new CheckinService();

  public getMyCheckins = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      if (!accountId) throw new HttpException(401, 'Unauthorized');

      const { page = 1, limit = 10 } = req.query;
      const result = await this.checkinService.getMyCheckins(accountId, Number(page), Number(limit));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // Mới: Controller cho /user
  public getUserManagedCheckins = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      const role = req.role?.toUpperCase();

      if (!accountId || role !== 'USER') {
        throw new HttpException(403, 'Forbidden: This route is for users only');
      }

      const { page = 1, limit = 10 } = req.query;
      const result = await this.checkinService.getUserManagedCheckins(accountId, Number(page), Number(limit));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public createCheckin = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      if (!accountId) throw new HttpException(401, 'Unauthorized');

      const imageFile = req.file;
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

  public getCheckinById = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const checkinId = req.params.id as string;
      const checkin = await this.checkinService.getCheckinById(checkinId);
      res.status(200).json({ data: checkin });
    } catch (error) {
      next(error);
    }
  };

  // Cập nhật: Controller cho /subject/:subjectId
  public getCheckinsBySubject = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      const role = req.role?.toUpperCase();
      if (!accountId || !role) throw new HttpException(401, 'Unauthorized');
      
      const subjectId = req.params.subjectId as string;
      const { page = 1, limit = 10 } = req.query;

      const result = await this.checkinService.getCheckinsBySubject(subjectId, Number(page), Number(limit), { id: accountId, role });
      res.status(200).json(result);
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

