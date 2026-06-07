import { Router } from 'express';
import * as authController from '../../controllers/auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { loginSchema, registerSchema, refreshTokenSchema, logoutSchema, forgotPasswordSchema, resetPasswordSchema, activateAccountSchema } from '../../dtos/auth.dto';

const router = Router();

// Route đăng nhập: Kiểm tra username/password, nếu đúng trả về cặp token (Access & Refresh)
router.post('/login', validate(loginSchema), authController.login);
// Route đăng ký tài khoản: Tạo thông tin tài khoản mới nhưng ở trạng thái chờ kích hoạt
router.post('/register', validate(registerSchema), authController.register);
// Route kích hoạt tài khoản qua Token: Thường dùng sau khi người dùng nhấn link trong Email
router.post('/activate-account', validate(activateAccountSchema), authController.activateAccount);
// Route làm mới Token: Cho phép lấy Access Token mới bằng Refresh Token mà không cần đăng nhập lại
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
// Route đăng xuất: Hủy phiên làm việc và vô hiệu hóa token hiện tại
router.post('/logout', validate(logoutSchema), authController.logout);
// Route quên mật khẩu: Tiếp nhận email và gửi mã/link khôi phục
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
// Route đặt lại mật khẩu: Sử dụng token khôi phục để thiết lập mật khẩu mới
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
// Route lấy thông tin cá nhân: Yêu cầu đăng nhập (authMiddleware) để xem thông tin User đang truy cập
router.get('/me', authMiddleware, authController.getMe);

export default router;
