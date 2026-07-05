import { Router } from 'express';
import ZoneController from '../../controllers/zones.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

//xử lý các yêu cầu liên quan đến vùng

class ZoneRoute {
  public path = '/zones';
  public router = Router();
  public zoneController = new ZoneController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(authMiddleware);//áp dụng middleware xác thực

    //lấy danh sách
    this.router.get('/',this.zoneController.getAll);

    //lấy thông tin chi tiết 1 zone theo id
    this.router.get('/:id',this.zoneController.getById);

    //tạo zone
    this.router.post('/',this.zoneController.create);

    //chỉnh sửa thông tin zone
    this.router.put('/:id',this.zoneController.update);

    //xóa zone
    this.router.delete('/:id',this.zoneController.delete);
  }
}

export default ZoneRoute;
