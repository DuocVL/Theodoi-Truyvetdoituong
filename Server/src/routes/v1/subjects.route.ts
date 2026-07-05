import { Router } from 'express';
import SubjectController from '../../controllers/subjects.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

//xử lý các yêu cầu với subject

class SubjectRoute {
  public path = '/subjects';
  public router = Router();
  public subjectController = new SubjectController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Route kích hoạt tài khoản là công khai 
    this.router.post('/activate', this.subjectController.activate);

    //middleware xác thực
    this.router.use(authMiddleware);

    //cacns bộ tạo đối tượng
    this.router.post('/', this.subjectController.create);

    //cập nhật fcm-token phục vụ gửi thông báo
    this.router.put('/fcm-token',this.subjectController.updateFCMToken);

    //cập nhật thông tin hồ sơ
    this.router.put('/:id',this.subjectController.update);

    //xóa hồ sơ
    this.router.delete('/:id',this.subjectController.delete);

    //lấy danh sách đối tượng
    this.router.get('/',this.subjectController.getAll);

    //lấy thông tin chi tiết 1 đối tượng
    this.router.get('/:id',this.subjectController.getById);
  }
}

export default SubjectRoute;
