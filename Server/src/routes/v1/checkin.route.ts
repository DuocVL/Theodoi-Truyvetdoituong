import { Router } from 'express';
import { CheckinController } from '../../controllers/checkin.controller';
import { CheckinService } from '../../services/checkin.service';
import { CheckinRepository } from '../../repositories/checkin.repository';
import { validate } from '../../middlewares/validate.middleware';
import { CreateCheckinDto, UpdateCheckinDto } from '../../dtos/checkins.dto';

export class CheckinRoute implements Routes {
  public path = '/checkins';
  public router = Router();

  // Composition Root: Instantiate and inject dependencies here
  private readonly repository = new CheckinRepository();
  private readonly service = new CheckinService(this.repository);
  public controller = new CheckinController(this.service);

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
        `${this.path}`,
        validationMiddleware(CreateCheckinDto, 'body'),
        this.controller.createCheckin
    );

    this.router.get(`${this.path}/:id`, this.controller.getCheckinById);
    this.router.get(`${this.path}/subject/:subjectId`, this.controller.getCheckinsBySubject);

    this.router.patch(
        `${this.path}/:id`,
        validationMiddleware(UpdateCheckinDto, 'body', true), // `true` allows partial updates
        this.controller.updateCheckin
    );
    
    this.router.delete(`${this.path}/:id`, this.controller.deleteCheckin);
  }
}
