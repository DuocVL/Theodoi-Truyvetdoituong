import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from '../dtos/auth.dto';
import { RequestWithUser } from '../types/data';

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loginData: LoginDto = req.body;
        const result = await authService.login(loginData);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const registerData: RegisterDto = req.body;
        const result = await authService.register(registerData);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshTokenData: RefreshTokenDto = req.body;
        const result = await authService.refreshToken(refreshTokenData);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;
        await authService.logout(refreshToken);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const forgotPasswordData: ForgotPasswordDto = req.body;
        await authService.forgotPassword(forgotPasswordData);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const resetPasswordData: ResetPasswordDto = req.body;
        await authService.resetPassword(resetPasswordData);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
        const accountId = req.account?.id;
        if (!accountId) return res.status(401).json({ message: 'Unauthorized' });
        const result = await authService.getMe(accountId);
        res.json({ data: result });
    } catch (error) {
        next(error);
    }
};
