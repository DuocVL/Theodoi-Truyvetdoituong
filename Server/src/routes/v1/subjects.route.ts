import { Router } from 'express';
import SubjectController from '../../controllers/subjects.controller';
import { authMiddleware } from '../../middlewares/auth.middleware'; // Assuming you have this
import { roleMiddleware } from '../../middlewares/role.middleware';

class SubjectRoute {
  public path = '/subjects';
  public router = Router();
  public subjectController = new SubjectController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Route kích hoạt dành cho đối tượng: Cho phép đối tượng tự kích hoạt bằng mã được cấp
    this.router.post('/activate', this.subjectController.activate);

    // Áp dụng kiểm tra đăng nhập và phân quyền cho toàn bộ các thao tác quản lý bên dưới
    this.router.use(authMiddleware);
    this.router.use(roleMiddleware);

    // Lấy danh sách tất cả các đối tượng thuộc diện quản lý
    this.router.get('/', this.subjectController.getAll);
    
    // Lấy thông tin chi tiết (hồ sơ, trạng thái) của một đối tượng cụ thể
    this.router.get('/:id', this.subjectController.getById);

    // Tạo mới một hồ sơ đối tượng cần theo dõi
    this.router.post('/', this.subjectController.create);

    // Cập nhật thông tin hồ sơ đối tượng
    this.router.put('/:id', this.subjectController.update);

    // Xóa hồ sơ đối tượng (thường là xóa mềm hoặc thu hồi quyền quản lý)
    this.router.delete('/:id', this.subjectController.delete);

  }
}

export default SubjectRoute;
