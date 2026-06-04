
import { Router } from 'express';
import UserController from '../../controllers/users.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { Route } from '../types/route.interface';

class UserRoute implements Route {
  public path = '/users';
  public router = Router();
  public userController = new UserController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // All user routes are protected and require ADMIN privileges
    this.router.use(this.path, authMiddleware, authorize(['ADMIN']));

    this.router.get(this.path, this.userController.getAll);
    this.router.get(`${this.path}/:id`, this.userController.getById);
    this.router.put(`${this.path}/:id`, this.userController.update);
    this.router.delete(`${this.path}/:id`, this.userController.delete);
  }
}

export default UserRoute;
