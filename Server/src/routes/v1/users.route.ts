import { Router } from 'express';
import UserController from '../../controllers/users.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';


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

    this.router.get(`/`, this.userController.getAll);
    this.router.get(`/:id`, this.userController.getById);
    this.router.put(`/:id`, this.userController.update);
    this.router.delete(`/:id`, this.userController.delete);
  }
}

export default UsersRoute;
