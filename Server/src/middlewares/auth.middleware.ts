import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from '../configs/env';
import * as accountRepository from '../repositories/account.repository';
import { getUserByAccountId } from '../repositories/user.repository';
import { AccountPayload } from '../types/data';

//Middleware xác thực token JWT và phân quyền
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {

    //kiểm tra header có tồn tại không
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    //lấy token
    const token = authHeader.split(" ")[1];

    try {
        //xác thực refreshtoken kết quả AccountPayload
        const decoded = jwt.verify(token, env.JWT_SECRET) as AccountPayload;

        //Kiểm tra decoded là object và có id field
        if (typeof decoded !== 'object' || !decoded.id) {
            return res.status(401).json({ message: "Unauthorized: Invalid token payload" });
        }

        //Kiểm tra trạng thái Account trong database
        const account = await accountRepository.findById(decoded.id);
        if (!account) {
            return res.status(401).json({ message: "Unauthorized: Account not found" });
        }
        //Không cho truy cập nếu account không phải ACTIVE
        if (account.status !== 'ACTIVE') {
            return res.status(403).json({ 
                message: `Forbidden: Account is ${account.status.toLowerCase()}` 
            });
        }

        //đính kèm AccountPayload và role vào Request
        req.account = decoded;

        //Nếu là type USER phải kiểm tra xem quyền USER/ADMIn rồi gắn vào Request
        req.role=account.type;
        if(req.role == "USER"){
            const user = await getUserByAccountId(req.account?.id)
            if(!user){
                return res.status(401).json({ message: "Unauthorized: Account not found" });
            }
            req.role = user.role
        }

        next();

    } catch (err) {
        // Xử lý lỗi JWT:
        if (err instanceof jwt.TokenExpiredError) {//TOken hết hạn TokenExpiredError
            return res.status(401).json({ message: "Unauthorized: Token has expired" });
        }
        if (err instanceof jwt.JsonWebTokenError) {//Token không hợp lệ
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }
        return res.status(500).json({ message: "Internal Server Error" });//lỗi khác do server
    }
};