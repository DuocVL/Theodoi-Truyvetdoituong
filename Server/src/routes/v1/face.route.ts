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
    /**
     * Route to register a new face.
     * Requires authentication and ADMIN or MANAGER role.
     */
    this.router.post(
      '/register',
      authMiddleware,
      checkRole([UserAccountRole.ADMIN, UserAccountRole.MANAGER]),
      this.faceController.uploadMiddleware, // Handles file upload
      this.faceController.register // Extracts and saves face vector
    );

    /**
     * Route for face-based check-in.
     * Requires authentication and any user role (ADMIN, MANAGER, or OPERATOR).
     * Compares uploaded image with stored biometric data.
     */
    this.router.post(
      '/check-in',
      authMiddleware,
      checkRole([UserAccountRole.ADMIN, UserAccountRole.MANAGER, UserAccountRole.OPERATOR]),
      this.faceController.uploadMiddleware,
      this.faceController.checkIn
    );
  }
}

export default FaceRoute;
