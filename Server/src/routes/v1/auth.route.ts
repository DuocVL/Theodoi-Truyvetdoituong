import { Router } from 'express';
import * as authController from '../../controllers/auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { loginSchema, registerSchema, refreshTokenSchema, logoutSchema, forgotPasswordSchema, resetPasswordSchema, activateAccountSchema } from '../../dtos/auth.dto';

const router = Router();

//Đăng nhập
router.post('/login', validate(loginSchema), authController.login);

//TODOĐăng ký(có thể phải bỏ)
router.post('/register', validate(registerSchema), authController.register);

//Kích hoạt tài khoản qua Token
router.post('/activate-account', validate(activateAccountSchema), authController.activateAccount);

//Làm mới Token
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

//Đăng xuất
router.post('/logout', validate(logoutSchema), authController.logout);

//Quên mật khẩu
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

//Đặt lại mật khẩu
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

//Lấy thông tin cá nhân
router.get('/me', authMiddleware, authController.getMe);

//Gửi lại mail active
router.post('/resend-activation-email',  authController.resendEmail);


export default router;
