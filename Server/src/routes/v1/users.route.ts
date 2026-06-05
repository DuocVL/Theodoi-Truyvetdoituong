
import { Router } from 'express';
import UserController from '../../controllers/users.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorize, roleMiddleware } from '../../middlewares/role.middleware';


class UserRoute {
  public path = '/users';
  public router = Router();
  public userController = new UserController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // All user routes are protected and require ADMIN privileges
    this.router.use(authMiddleware, roleMiddleware, authorize(['ADMIN']));

    this.router.get('/', this.userController.getAll);
    this.router.get('/:id', this.userController.getById);
    this.router.put('/:id', this.userController.update);
    this.router.delete('/:id', this.userController.delete);
  }
}

export default UserRoute;
