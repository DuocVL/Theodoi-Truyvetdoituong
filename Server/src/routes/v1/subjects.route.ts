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
    this.router.use(authMiddleware);
    this.router.use(roleMiddleware);

    // GET /api/v1/subjects - Get all subjects
    this.router.get(`${this.path}`, this.subjectController.getAll);
    
    // GET /api/v1/subjects/:id - Get a single subject by ID
    this.router.get(`${this.path}/:id`, this.subjectController.getById);

    // POST /api/v1/subjects - Create a new subject profile
    this.router.post(`${this.path}`, this.subjectController.create);

    // POST /api/v1/subjects/activate - Activate the account (should this be public? moved it for now)
    // This is a public route, as the token itself is the secret.
    // Note: It might be better to have a separate, unauthenticated route for activation.
    this.router.post(`${this.path}/activate`, this.subjectController.activate);

    // PUT /api/v1/subjects/:id - Update a subject
    this.router.put(`${this.path}/:id`, this.subjectController.update);

    // DELETE /api/v1/subjects/:id - Delete a subject
    this.router.delete(`${this.path}/:id`, this.subjectController.delete);

  }
}

export default SubjectRoute;
