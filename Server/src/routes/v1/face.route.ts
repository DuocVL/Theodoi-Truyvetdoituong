import { Router } from 'express';
import FaceController from '../../controllers/face.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/rbac.middleware'; // Import the new RBAC middleware
import { UserAccountRole } from '../../../generated/prisma/client'; // Import the Role enum


class FaceRoute {
  public path = '/face';
  public router = Router();
  public faceController = new FaceController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(authMiddleware);

    // Route to register a new face.
    // Accessible by ADMIN and USER roles.
    this.router.post(
      '/register',
      checkRole([UserAccountRole.ADMIN, UserAccountRole.USER]),
      this.faceController.uploadMiddleware,
      this.faceController.register
    );

    // Route for face-based check-in.
    // Accessible by ADMIN and USER roles.
    this.router.post(
      '/check-in',
      checkRole([UserAccountRole.ADMIN, UserAccountRole.USER]),
      this.faceController.uploadMiddleware,
      this.faceController.checkIn
    );
  }
}

export default FaceRoute;
