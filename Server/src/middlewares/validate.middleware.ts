import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware kiểm tra và chuẩn hóa dữ liệu từ request body, query, params
 * Sử dụng Zod schema để validate và transform dữ liệu đầu vào
 * 
 * Công dụng:
 * 1. Validate request data theo schema
 * 2. Transform và filter dữ liệu
 * 3. Return 400 Bad Request nếu validation fail
 * 4. Pass data qua cho next middleware/controller
 * 
 * Cách sử dụng:
 * const userSchema = z.object({
 *   body: z.object({ name: z.string(), email: z.string().email() }),
 *   query: z.object({ page: z.coerce.number().optional() }),
 *   params: z.object({ id: z.string().uuid() })
 * });
 * 
 * router.post('/:id', validate(userSchema), controller);
 */
export const validate = (schema: ZodSchema<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            /**
             * Parse request data thông qua Zod schema
             * Schema mong đợi object có structure: { body, query, params }
             */
            const data = schema.parse({
                body: req.body,
                query: req.query,
                params: req.params
            });

            /**
             * Kiểm tra xem parsed data có chứa các property cần thiết không
             * Type guard: Đảm bảo data là object hợp lệ
             */
            if (!data || typeof data !== 'object') {
                return res.status(400).json({
                    success: false,
                    message: "Dữ liệu không hợp lệ: kết quả validation không phải object",
                });
            }

            /**
             * Gán dữ liệu đã validate vào request
             * Nếu schema không transform field nào, giữ nguyên original value
             */
            const validatedData = data as Record<string, any>;
            
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
            /**
             * Bắt lỗi Zod validation
             * Trả về 400 Bad Request với chi tiết lỗi từng field
             */
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    message: "Dữ liệu không hợp lệ",
                    errors: error.flatten().fieldErrors,
                });
            }
            
            /**
             * Bắt các lỗi không phải ZodError
             * Chuyển cho error handler middleware tổng thể
             */
            next(error);
        }
    };
};