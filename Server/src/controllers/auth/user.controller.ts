import { Request, Response, NextFunction } from 'express';
import * as authService from "../../services/auth.service.js";


export const login = async ( req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;

        const result = await authService.login(data, "user");

        return res.status(200).json({
            status: 'success',
            data: result,
        });
        
    } catch (error) {
        next(error);
    }
    
}

export const register = async ( req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;

        const result = await authService.register(data);

        return res.status(200).json({
            status: 'success',
            data: result,
        });
        
    } catch (error) {
        next(error);
    }  
}

