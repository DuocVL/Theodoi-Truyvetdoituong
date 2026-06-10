import { Router } from 'express';
import SubjectController from '../../controllers/subjects.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/rbac.middleware'; // Import the new RBAC middleware
import { UserAccountRole } from '../../../generated/prisma/client'; // Import the Role enum

class SubjectRoute {
  public path = '/subjects';
  public router = Router();
  public subjectController = new SubjectController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Route kích hoạt tài khoản là công khai (không cần token Bearer)
    this.router.post('/activate', this.subjectController.activate);

    // All subject routes require authentication first.
    this.router.use(authMiddleware);

    // Routes for creating, updating, and deleting subjects.
    // Accessible by both ADMIN and USER roles.
    this.router.post(
      '/',
      this.subjectController.create
    );
    this.router.put(
      '/:id',
      this.subjectController.update
    );
    this.router.delete(
      '/:id',
      this.subjectController.delete
    );

    // Routes for viewing subjects.
    // Accessible by both ADMIN and USER roles.
    this.router.get(
      '/',
      checkRole([UserAccountRole.ADMIN, UserAccountRole.USER]),
      this.subjectController.getAll
    );
    this.router.get(
      '/:id',
      checkRole([UserAccountRole.ADMIN, UserAccountRole.USER]),
      this.subjectController.getById
    );
  }
}

export default SubjectRoute;
