import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

//Middleware kiểm tra và chuẩn hóa dữ liệu từ request body, query, params bằng ZodSchema

export const validate = (schema: ZodSchema<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {

            //Thu nhập các dữ liệu body,query,params từ requestvà kiểm tra xem nó khớp với schema không
            //nếu không khớp -> zoderror
            const data = schema.parse({
                body: req.body,
                query: req.query,
                params: req.params
            });

            //Kiểm tra tính hợp lệ của kết quả trả về sau khi parse thành công xem có rỗng , phải object không
            if (!data || typeof data !== 'object') {
                return res.status(400).json({
                    success: false,
                    message: "Dữ liệu không hợp lệ: kết quả validation không phải object",
                });
            }

            //Chuyển về kiểu dữ liệu key-value
            const validatedData = data as Record<string, any>;
            
            //Ghi đè lại dữ liệu đã qua xử lý vào Request
            if (validatedData.body !== undefined) {
                req.body = validatedData.body;
            }
            if (validatedData.query !== undefined) {
                req.query = validatedData.query;
            }
            if (validatedData.params !== undefined) {
                req.params = validatedData.params;
            }

            next();
        } catch (error) {

            //Xử lý trường hợp dữ liệu không hợp lệ
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    message: "Dữ liệu không hợp lệ",
                    errors: error.flatten().fieldErrors,
                });
            }
            
            //Nếu lỗi khác tiếp tục xử lý với errormiddleware
            next(error);
        }
    };
};