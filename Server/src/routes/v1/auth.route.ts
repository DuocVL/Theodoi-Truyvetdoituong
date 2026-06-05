import { Router } from 'express';
import * as authController from '../../controllers/auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { loginSchema, registerSchema, refreshTokenSchema, logoutSchema, forgotPasswordSchema, resetPasswordSchema } from '../../dtos/auth.dto';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/register', validate(registerSchema), authController.register);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', validate(logoutSchema), authController.logout);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', authMiddleware, authController.getMe);

export default router;
