import { Router } from 'express';
import UserController from '../../controllers/users.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';// Import the new RBAC middleware
import { UserAccountRole } from '../../../generated/prisma/client'; // Import the Role enum


class UsersRoute {
  public path = '/users';
  public router = Router();
  public userController = new UserController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // All user management routes are protected and restricted to ADMINs.
    this.router.use(authMiddleware);

    // this.router.get(`${this.path}`, this.userController.getUsers);
    // this.router.get(`${this.path}/:id`, this.userController.getUserById);
    // this.router.post(`${this.path}`, this.userController.createUser);
    // this.router.put(`${this.path}/:id`, this.userController.updateUser);
    // this.router.delete(`${this.path}/:id`, this.userController.deleteUser);
  }
}

export default UsersRoute;
