import { Router } from 'express';
import * as logController from '../../controllers/alerts.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';// Import the new RBAC middleware

const router = Router();
router.use(authMiddleware);

router.get('/', logController.getAllLogs);

export default router;