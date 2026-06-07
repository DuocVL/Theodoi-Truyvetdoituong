import { Router } from 'express';
import SubjectController from '../../controllers/subjects.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/rbac.middleware'; // Import the new RBAC middleware
import { UserAccountRole } from '../../../generated/prisma'; // Import the Role enum

class SubjectRoute {
  public path = '/subjects';
  public router = Router();
  public subjectController = new SubjectController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Route for subjects to activate themselves, does not require auth
    this.router.post('/activate', this.subjectController.activate);

    // All subsequent routes require a user to be authenticated.
    this.router.use(authMiddleware);

    // GET routes: View all subjects or a specific one.
    // Allowed for all user roles (ADMIN, MANAGER, OPERATOR).
    this.router.get(
      '/',
      checkRole([UserAccountRole.ADMIN, UserAccountRole.MANAGER, UserAccountRole.OPERATOR]),
      this.subjectController.getAll
    );
    this.router.get(
      '/:id',
      checkRole([UserAccountRole.ADMIN, UserAccountRole.MANAGER, UserAccountRole.OPERATOR]),
      this.subjectController.getById
    );

    // POST route: Create a new subject.
    // Restricted to ADMIN and MANAGER roles.
    this.router.post(
      '/',
      checkRole([UserAccountRole.ADMIN, UserAccountRole.MANAGER]),
      this.subjectController.create
    );

    // PUT route: Update an existing subject.
    // Restricted to ADMIN and MANAGER roles.
    this.router.put(
      '/:id',
      checkRole([UserAccountRole.ADMIN, UserAccountRole.MANAGER]),
      this.subjectController.update
    );

    // DELETE route: Delete a subject.
    // Restricted to ADMIN role only for safety.
    this.router.delete(
      '/:id',
      checkRole([UserAccountRole.ADMIN]),
      this.subjectController.delete
    );
  }
}

export default SubjectRoute;
