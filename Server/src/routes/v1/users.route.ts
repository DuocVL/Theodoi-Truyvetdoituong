
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

    // Lấy danh sách toàn bộ cán bộ quản lý trong hệ thống
    this.router.get('/', this.userController.getAll);
    // Lấy thông tin cá nhân của một cán bộ cụ thể
    this.router.get('/:id', this.userController.getById);
    // Cập nhật thông tin hoặc phân lại quyền cho cán bộ
    this.router.put('/:id', this.userController.update);
    // Xóa cán bộ khỏi hệ thống quản lý
    this.router.delete('/:id', this.userController.delete);
  }
}

export default UserRoute;
