
import { Router } from 'express';
import SubjectController from '../../controllers/subjects.controller';
import { authMiddleware } from '../../middlewares/auth.middleware'; // Assuming you have this
import { Route } from '../types/route.interface';

class SubjectRoute implements Route {
  public path = '/subjects';
  public router = Router();
  public subjectController = new SubjectController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // POST /api/v1/subjects - Create a new subject profile and send invitation
    // This route should be protected and accessible only by authorized users (e.g., officers)
    this.router.post(`${this.path}`, authMiddleware, this.subjectController.create);

    // POST /api/v1/subjects/activate - Activate the account using a token
    // This is a public route, as the token itself is the secret.
    this.router.post(`${this.path}/activate`, this.subjectController.activate);

    // You can add other subject-related routes here:
    // this.router.get(`${this.path}`, authMiddleware, this.subjectController.getAll);
    // this.router.get(`${this.path}/:id`, authMiddleware, this.subjectController.getById);
  }
}

export default SubjectRoute;
