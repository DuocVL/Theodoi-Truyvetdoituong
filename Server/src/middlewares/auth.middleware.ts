import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from '../configs/env';
import * as accountRepository from '../repositories/account.repository';
import { AccountPayload } from '../types/data';

/**
 * Middleware xác thực token JWT
 * 
 * Chức năng:
 * 1. Kiểm tra xem request có header Authorization với Bearer token không
 * 2. Verify token bằng JWT_SECRET
 * 3. Kiểm tra Account có status = ACTIVE hay không (xóa tạm thời không được access)
 * 4. Attach AccountPayload (từ JWT) vào req.account
 * 5. Cho phép request tiếp tục (gọi next())
 * 
 * Lỗi có thể xảy ra:
 * - 401: Không có token, token hết hạn, token không hợp lệ
 * - 403: Account bị suspend hoặc chưa kích hoạt
 * - 500: Lỗi server
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    console.log("authHeader:", authHeader);

    // 🔍 Kiểm tra Bearer token có tồn tại không
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // 🔪 Cắt lấy token từ "Bearer <token>"
    const token = authHeader.split(" ")[1];
    console.log("token:", token);

    try {
        /**
         * Verify JWT token:
         * - Sử dụng JWT_SECRET (không phải ACCESS_TOKEN_SECRET)
         * - Kết quả: decoded = { id, type, device_id, iat, exp, ... }
         */
        const decoded = jwt.verify(token, env.JWT_SECRET) as AccountPayload;
        console.log("decoded:", decoded);

        // ✔️ Kiểm tra decoded là object và có id field
        if (typeof decoded !== 'object' || !decoded.id) {
            return res.status(401).json({ message: "Unauthorized: Invalid token payload" });
        }

        /**
         * 🛡️ Kiểm tra trạng thái Account trong database:
         * Lý do: Nếu admin disable/suspend account sau khi user login,
         * cần chặn user tiếp tục dùng token cũ
         */
        const account = await accountRepository.findById(decoded.id);
        console.log("account:", account);


        if (!account) {
            return res.status(401).json({ message: "Unauthorized: Account not found" });
        }

        // ⛔ Không cho access nếu account không phải ACTIVE
        if (account.status !== 'ACTIVE') {
            return res.status(403).json({ 
                message: `Forbidden: Account is ${account.status.toLowerCase()}` 
            });
        }

        /**
         * ✅ ATTACH DATA VÀO REQUEST:
         * 
         * Middleware này attach 2 thứ vào request:
         * 1. req.account = decoded (AccountPayload từ JWT)
         *    - Chứa: { id, type, device_id }
         *    - Dùng để: Xác định user, check role, multi-device tracking
         * 
         * 2. Không attach req.tokenPayload (không cần thiết)
         *    - Nếu downstream cần token original, gọi jwt.decode() riêng
         */
        req.account = decoded;

        req.role=account.type;

        // ✔️ Cho phép request tiếp tục tới controller
        next();

    } catch (err) {
        /**
         * Xử lý lỗi JWT:
         * - TokenExpiredError: Token hết hạn (user cần refresh)
         * - JsonWebTokenError: Token không hợp lệ/corrupted
         * - Lỗi khác: Server error
         */
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Unauthorized: Token has expired" });
        }
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }
        return res.status(500).json({ message: "Internal Server Error" });
    }
};