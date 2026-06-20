import { Router } from 'express';
import ZoneController from '../../controllers/zones.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';// Import the new RBAC middleware
import { UserAccountRole } from '../../../generated/prisma/client'; // Import the Role enum

class ZoneRoute {
  public path = '/zones';
  public router = Router();
  public zoneController = new ZoneController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(authMiddleware);

    // All zone management routes (GET, POST, PUT, DELETE) are accessible by ADMIN and USER roles.
    this.router.get(
      '/',
      this.zoneController.getAll
    );
    this.router.get(
      '/:id',
      this.zoneController.getById
    );
    this.router.post(
      '/',
      this.zoneController.create
    );
    this.router.put(
      '/:id',
      this.zoneController.update
    );
    this.router.delete(
      '/:id',
      this.zoneController.delete
    );
  }
}

export default ZoneRoute;
