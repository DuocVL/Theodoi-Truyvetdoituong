import { Router } from 'express';
import UserController from '../../controllers/users.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/rbac.middleware'; // Import the new RBAC middleware
import { UserAccountRole } from '../../../generated/prisma/client'; // Import the Role enum

class UserRoute {
  public path = '/users';
  public router = Router();
  public userController = new UserController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // All user-related routes require authentication first.
    this.router.use(authMiddleware);

    // GET routes: View all users or a specific one.
    // Allowed for ADMIN and MANAGER roles.
    this.router.get(
      '/',
      checkRole([UserAccountRole.ADMIN, UserAccountRole.MANAGER]),
      this.userController.getAll
    );
    this.router.get(
      '/:id',
      checkRole([UserAccountRole.ADMIN, UserAccountRole.MANAGER]),
      this.userController.getById
    );

    // POST route: Create a new user.
    // We will assume that user creation happens via the /auth/register endpoint for now.
    // If there's a need for an admin to create a user, we would add a POST route here.
    // this.router.post('/', checkRole([UserAccountRole.ADMIN]), this.userController.create);

    // PUT route: Update an existing user.
    // Restricted to ADMIN role.
    this.router.put(
      '/:id',
      checkRole([UserAccountRole.ADMIN]),
      this.userController.update
    );

    // DELETE route: Delete a user.
    // Restricted to ADMIN role.
    this.router.delete(
      '/:id',
      checkRole([UserAccountRole.ADMIN]),
      this.userController.delete
    );
  }
}

export default UserRoute;
