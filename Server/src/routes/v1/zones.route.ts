
import { Router } from 'express';
import ZoneController from '../../controllers/zones.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';


class ZoneRoute {
  public path = '/zones';
  public router = Router();
  public zoneController = new ZoneController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(authMiddleware); // Apply auth middleware to all zone routes

    // Tạo mới một vùng giám sát (Geofence)
    this.router.post('/', this.zoneController.create);
    // Lấy danh sách tất cả các vùng đã thiết lập
    this.router.get('/', this.zoneController.getAll);
    // Xem thông tin chi tiết và tọa độ của một vùng
    this.router.get('/:id', this.zoneController.getById);
    // Cập nhật phạm vi hoặc tên vùng
    this.router.put('/:id', this.zoneController.update);
    // Xóa vùng giám sát
    this.router.delete('/:id', this.zoneController.delete);
  }
}

export default ZoneRoute;
