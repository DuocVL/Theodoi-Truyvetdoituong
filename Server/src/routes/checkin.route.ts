
import { Router } from 'express';
import { Routes } from '@/interfaces/routes.interface';
import { validationMiddleware } from '@/middlewares/validation.middleware';
import { CheckinController } from '@/controllers/checkin.controller';
import { CheckinService } from '@/services/checkin.service';
import { CheckinRepository } from '@/repositories/checkin.repository';
import { CreateCheckinDto, UpdateCheckinDto } from '@/dtos/checkin.dto';

/**
 * Route class that defines all API endpoints for the check-in module.
 * It acts as the Composition Root for this feature.
 */
export class CheckinRoute implements Routes {
  public path = '/checkins';
  public router = Router();

  // Composition Root: All dependencies are instantiated and injected here.
  private readonly repository = new CheckinRepository();
  private readonly service = new CheckinService(this.repository);
  public controller = new CheckinController(this.service);

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // POST /checkins - Create a new check-in
    this.router.post(
      `${this.path}`,
      validationMiddleware(CreateCheckinDto, 'body'),
      this.controller.createCheckin
    );

    // GET /checkins/:id - Get a single check-in by its ID
    this.router.get(`${this.path}/:id`, this.controller.getCheckinById);

    // GET /checkins/subject/:subjectId - Get all check-ins for a subject
    this.router.get(`${this.path}/subject/:subjectId`, this.controller.getCheckinsBySubject);

    // PATCH /checkins/:id - Update an existing check-in
    this.router.patch(
      `${this.path}/:id`,
      validationMiddleware(UpdateCheckinDto, 'body', true), // `true` allows for partial updates
      this.controller.updateCheckin
    );
    
    // DELETE /checkins/:id - Delete a check-in
    this.router.delete(`${this.path}/:id`, this.controller.deleteCheckin);
  }
}
