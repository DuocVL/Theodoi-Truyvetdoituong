
import { Router } from 'express';
import ZoneController from '../../controllers/zones.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { Route } from '../types/route.interface';

class ZoneRoute implements Route {
  public path = '/zones';
  public router = Router();
  public zoneController = new ZoneController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(this.path, authMiddleware); // Apply auth middleware to all zone routes

    this.router.post(this.path, this.zoneController.create);
    this.router.get(this.path, this.zoneController.getAll);
    this.router.get(`${this.path}/:id`, this.zoneController.getById);
    this.router.put(`${this.path}/:id`, this.zoneController.update);
    this.router.delete(`${this.path}/:id`, this.zoneController.delete);
  }
}

export default ZoneRoute;
