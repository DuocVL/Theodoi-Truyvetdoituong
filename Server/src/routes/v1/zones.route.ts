
import { Router } from 'express';
import ZoneController from '../../controllers/zones.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';


class ZoneRoute {
  public path = '/zones';
  public router = Router();
  public zoneController = new ZoneController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(authMiddleware); // Apply auth middleware to all zone routes

    this.router.post('/', this.zoneController.create);
    this.router.get('/', this.zoneController.getAll);
    this.router.get('/:id', this.zoneController.getById);
    this.router.put('/:id', this.zoneController.update);
    this.router.delete('/:id', this.zoneController.delete);
  }
}

export default ZoneRoute;
