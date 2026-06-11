
import { NextFunction, Request, Response } from 'express';
import { CheckinService } from '@/services/checkin.service';
import { CreateCheckinDto, UpdateCheckinDto } from '@/dtos/checkin.dto';
import { Checkin } from '@prisma/client';

export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  public createCheckin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const checkinData: CreateCheckinDto = req.body;
      const newCheckin: Checkin = await this.checkinService.createCheckin(checkinData);
      res.status(201).json({ data: newCheckin, message: 'created' });
    } catch (error) {
      next(error);
    }
  };

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

  public updateCheckin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const checkinId: string = req.params.id;
      const checkinData: UpdateCheckinDto = req.body;
      const updatedCheckin: Checkin = await this.checkinService.updateCheckin(checkinId, checkinData);
      res.status(200).json({ data: updatedCheckin, message: 'updated' });
    } catch (error) {
      next(error);
    }
  };

  public deleteCheckin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const checkinId: string = req.params.id;
      const deletedCheckin: Checkin = await this.checkinService.deleteCheckin(checkinId);
      res.status(200).json({ data: deletedCheckin, message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };
}
