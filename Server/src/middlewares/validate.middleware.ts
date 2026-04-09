//Kiểm tra , chuẩn hóa đầu vào từ request
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod/v3';

export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
    
            const data = schema.parse({
                body: req.body,
                query: req.query,
                params: req.params
            });

            //gán dữ liệu đã validate
            req.body = data.body;
            req.query = data.query;
            req.params = data.params;

            next();
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: "validation error"

                //TODO ghi log
            });
        }
    }
}