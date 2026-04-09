import { Request, Response, NextFunction } from 'express';
import * as authService from "../../services/auth.service.js";


export const changePassword = async ( req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;

        const result = await authService.changePassword(data, req.account);

        return res.status(200).json({
            status: 'success',
        });
        
    } catch (error) {
        next(error);
    }
    
} 

export const forgotPassword = async ( req: Request, res: Response, next: NextFunction) => {
    try {
        //TODO xử lý quên mật khẩu với email
        
    } catch (error) {
        next(error);
    }
    
}

export const refreshToken = async ( req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService
    } catch (error) {
        next(error);
    }

}