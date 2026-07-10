import { Router } from 'express';
import UserController from '../../controllers/users.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

//các yêu cầu liên quan đến cán bộ

class UsersRoute {
  public path = '/users';
  public router = Router();
  public userController = new UserController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    //áp dụng middleware xác thực 
    this.router.use(authMiddleware);

    //lấy danh sách user
    this.router.get(`/`, this.userController.getAll);

    //lấy thông tin chi tiết 1 user
    this.router.get(`/:id`, this.userController.getById);

    //cập nhật thông tin
    this.router.put(`/:id`, this.userController.update);

    //xóa user
    this.router.delete(`/:id`, this.userController.delete);
  }
}

export default UsersRoute;
