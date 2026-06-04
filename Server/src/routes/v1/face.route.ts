
import { Router } from 'express';
import FaceController from '../../controllers/face.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
// No Routes interface – removed

class FaceRoute {
  public path = '/face';
  public router = Router();
  public faceController = new FaceController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Route for registering a new face. Applies auth middleware and then multer middleware.
    this.router.post(
      `${this.path}/register`,
      authMiddleware,
      this.faceController.uploadMiddleware,
      this.faceController.register
    );

    // Route for performing a check-in. Also protected by auth and uses multer.
    this.router.post(
      `${this.path}/check-in`,
      authMiddleware,
      this.faceController.uploadMiddleware,
      this.faceController.checkIn
    );
  }
}

export default FaceRoute;
