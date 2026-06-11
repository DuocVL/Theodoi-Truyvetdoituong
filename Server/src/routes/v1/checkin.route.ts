import { Router } from 'express';
import { CheckinController } from '../../controllers/checkin.controller';
import { validate } from '../../middlewares/validate.middleware';
import { CreateCheckinDto, UpdateCheckinDto } from '../../dtos/checkin.dto';

export class CheckinRoute{
  public path = '/checkins';
  public router = Router();
  public checkinController = new CheckinController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, validate(CreateCheckinDto, 'body'), this.checkinController.createCheckin);
    this.router.get(`${this.path}/:id`, this.checkinController.getCheckinById);
    this.router.get(`${this.path}/subject/:subjectId`, this.checkinController.getCheckinsBySubject);
    this.router.patch(`${this.path}/:id`, validationMiddleware(UpdateCheckinDto, 'body', true), this.checkinController.updateCheckin);
    this.router.delete(`${this.path}/:id`, this.checkinController.deleteCheckin);
  }
}
