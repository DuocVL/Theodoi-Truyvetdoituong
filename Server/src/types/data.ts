import { JwtPayload } from "jsonwebtoken";
import { Request } from "express";

//Định nghĩa cấu trúc dữ liệu (Payload) chứa trong mã.
 
export interface AccountPayload extends JwtPayload {
    id: string;                  // ID tài khoản 
    type: "USER" | "SUBJECT";    // Phân loại tài khoản 
    device_id: string;           // ID thiết bị đăng nhập 
}

//Định nghĩa kiểu Request tùy chỉnh bằng cách gộp interface Request mặc định của Express và thêm thuộc tính account.

export type RequestWithUser = Request & { account?: AccountPayload };

// Sử dụng declare global để can thiệp trực tiếp vào không gian tên gốc của Express.
// Kỹ thuật này giúp bổ sung vĩnh viễn các thuộc tính custom vào lòng object Request trên toàn bộ dự án
// mà không cần phải import kiểu dữ liệu RequestWithUser thủ công ở khắp mọi nơi.

declare global {
    namespace Express {
        interface Request {
            // Lưu trữ thông tin tài khoản đã được xác thực từ mã token (được gán từ Auth Middleware)
            account?: AccountPayload;
            
            // Lưu vai trò hiện tại của tài khoản
            role?: string;
            
            // Mã định danh duy nhất cho mỗi lượt Request gửi tới hệ thống
            requestId: string;
        }
    }
}