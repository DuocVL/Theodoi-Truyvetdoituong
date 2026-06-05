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
    // Public activation route. The activation token is the credential.
    this.router.post('/activate', this.subjectController.activate);

    this.router.use(authMiddleware);
    this.router.use(roleMiddleware);

    // GET /api/v1/subjects - Get all subjects
    this.router.get('/', this.subjectController.getAll);
    
    // GET /api/v1/subjects/:id - Get a single subject by ID
    this.router.get('/:id', this.subjectController.getById);

    // POST /api/v1/subjects - Create a new subject profile
    this.router.post('/', this.subjectController.create);

    // PUT /api/v1/subjects/:id - Update a subject
    this.router.put('/:id', this.subjectController.update);

    // DELETE /api/v1/subjects/:id - Delete a subject
    this.router.delete('/:id', this.subjectController.delete);

  }
}

export default SubjectRoute;
