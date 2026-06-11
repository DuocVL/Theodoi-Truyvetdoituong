
import { Request, Response, NextFunction } from 'express';
import { CheckinService } from '@/services/checkin.service';
import { CreateCheckinDto, UpdateCheckinDto } from '@/dtos/checkin.dto';

export class CheckinController {
  private checkinService = new CheckinService();

  public createCheckin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: CreateCheckinDto = req.body;
      const newCheckin = await this.checkinService.createCheckin(data);
      res.status(201).json({ data: newCheckin, message: 'created' });
    } catch (error) {
      next(error);
    }
  }

  public getCheckinById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const checkin = await this.checkinService.getCheckinById(id);
      res.status(200).json({ data: checkin });
    } catch (error) {
      next(error);
    }
  }

  public getCheckinsBySubject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subjectId = req.params.subjectId;
      const checkins = await this.checkinService.getCheckinsBySubject(subjectId);
      res.status(200).json({ data: checkins });
    } catch (error) {
      next(error);
    }
  }

  public updateCheckin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const data: UpdateCheckinDto = req.body;
      const updatedCheckin = await this.checkinService.updateCheckin(id, data);
      res.status(200).json({ data: updatedCheckin, message: 'updated' });
    } catch (error) {
      next(error);
    }
  }

  public deleteCheckin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      await this.checkinService.deleteCheckin(id);
      res.status(204).send(); // No Content
    } catch (error) {
      next(error);
    }
  }
}
