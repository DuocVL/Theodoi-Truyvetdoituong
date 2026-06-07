import { Router } from 'express';
import ZoneController from '../../controllers/zones.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/rbac.middleware'; // Import the new RBAC middleware
import { UserAccountRole } from '../../../generated/prisma'; // Import the Role enum

class ZoneRoute {
  public path = '/zones';
  public router = Router();
  public zoneController = new ZoneController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(authMiddleware); // Apply auth middleware to all zone routes

    // GET routes: View all zones or a specific one.
    // Allowed for all user roles.
    this.router.get(
      '/',
      checkRole([UserAccountRole.ADMIN, UserAccountRole.MANAGER, UserAccountRole.OPERATOR]),
      this.zoneController.getAll
    );
    this.router.get(
      '/:id',
      checkRole([UserAccountRole.ADMIN, UserAccountRole.MANAGER, UserAccountRole.OPERATOR]),
      this.zoneController.getById
    );

    // POST route: Create a new zone.
    // Restricted to ADMIN and MANAGER roles.
    this.router.post(
      '/',
      checkRole([UserAccountRole.ADMIN, UserAccountRole.MANAGER]),
      this.zoneController.create
    );

    // PUT route: Update an existing zone.
    // Restricted to ADMIN and MANAGER roles.
    this.router.put(
      '/:id',
      checkRole([UserAccountRole.ADMIN, UserAccountRole.MANAGER]),
      this.zoneController.update
    );

    // DELETE route: Delete a zone.
    // Restricted to ADMIN and MANAGER roles.
    this.router.delete(
      '/:id',
      checkRole([UserAccountRole.ADMIN, UserAccountRole.MANAGER]),
      this.zoneController.delete
    );
  }
}

export default ZoneRoute;
