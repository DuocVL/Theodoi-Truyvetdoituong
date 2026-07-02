import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { ActivateAccountDto, LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto, ResendActivationEmailDto } from '../dtos/auth.dto';
import { RequestWithUser } from '../types/data';

//Xử lý yêu cầu đăng nhập
export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loginData: LoginDto = req.body;
        const result = await authService.login(loginData);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

//TODO Xử lý đăng ký (có thể phải bỏ)
export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const registerData: RegisterDto = req.body;
        const result = await authService.register(registerData);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

//XỬ lý kích hoạt tài khoản
export const activateAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const activationData: ActivateAccountDto = req.body;
        const result = await authService.activateAccount(activationData);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

//Xử lý sinh token mới cho người dùng
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshTokenData: RefreshTokenDto = req.body;
        const result = await authService.refreshToken(refreshTokenData);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

//Xử lý việc đăng xuất
export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;
        await authService.logout(refreshToken);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

//Xử lý việc quên mật khẩu
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const forgotPasswordData: ForgotPasswordDto = req.body;
        await authService.forgotPassword(forgotPasswordData);
        res.status(200).json({ message: "Password reset link sent to your email." });
    } catch (error) {
        next(error);
    }
};

//Xử lý đổi mật khẩu
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const resetPasswordData: ResetPasswordDto = req.body;
        console.log(resetPasswordData);
        await authService.resetPassword(resetPasswordData);
        res.status(200).json({ message: "Password has been reset successfully." });
    } catch (error) {
        next(error);
    }
};

//Xử lý lấy thông tin cá nhân
export const getMe = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
        const accountId = req.account?.id;
        if (!accountId) return res.status(401).json({ message: 'Unauthorized' });
        const result = await authService.getMe(accountId);
        res.json({ user: result });//TODO
    } catch (error) {
        next(error);
    }
};

//gửi lại email kích hoạt tài khoản
export const resendEmail = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
        const emailData: ResendActivationEmailDto = req.body;
        await authService.resendEmailActive(emailData.email);
        res.status(200).json({message: "Send email successfully"});
    } catch (error) {
        next(error);
    }
};
