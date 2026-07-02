import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from 'uuid';
import { logger } from "../utils/log-helper";
import { createSystemLog } from '../repositories/log.repository';
import { getUserByAccountId } from '../repositories/user.repository';
import { getSubjectByAccountId } from '../repositories/subject.repository';

// Danh sách tập hợp các trường nhạy cảm cần che giấu không lưu lại CSDL
const SENSITIVE_FIELDS = new Set([
  'password', 'newPassword', 'confirmPassword', 'token', 'accessToken', 'refreshToken',
]);

/*
 Hàm đệ quy giúp làm sạch dữ liệu tìm và thay thế giá trị các trường nhạy cảm bằng '[REDACTED]' 
 do cấu trúc json lồng nhau 
 value Dữ liệu đầu vào cần lọc (body, query, hoặc response)
 seen Bộ lưu vết để phát hiện và ngăn chặn lỗi tràn bộ nhớ do tham chiếu vòng
 */
const redactSensitiveData = (value: unknown, seen = new WeakSet()): unknown => {
  if (Array.isArray(value)) return value.map(item => redactSensitiveData(item, seen));

  if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
    // Nếu object này đã từng được duyệt qua trước đó trong cây phân cấp, trả về '[Circular]' để tránh lặp vô hạn
    if (seen.has(value as object)) return '[Circular]';
    seen.add(value as object);

    // Duyệt qua từng cặp key-value của object
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        // Nếu key nằm trong danh sách nhạy cảm -> ẩn đi. Nếu không -> tiếp tục đệ quy sâu hơn
        SENSITIVE_FIELDS.has(key) ? '[REDACTED]' : redactSensitiveData(item, seen),
      ])
    );
  }
  return value;
};

//Middleware ghi log hệ thống và Ghi nhận toàn bộ luồng Request - Response

export const loggingMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now(); // Ghi nhận mốc thời gian bắt đầu nhận Request
  const requestId = uuidv4(); // Tạo mã định danh duy nhất cho request này
  req.requestId = requestId; // Gạ́n vào đối tượng `req` global để các tầng sau có thể xâu chuỗi log

  const { method, originalUrl } = req;
  // Lấy IP của Client 
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || '').toString();
  const userAgent = req.headers["user-agent"] || 'unknown';

  // In log thông báo: Có một request mới đi VÀO (-->) hệ thống
  logger.info(`--> ${method} ${originalUrl}`, { requestId, ip, userAgent });

  // Lưu lại hàm send gốc của Express để can thiệp vào hàm res.send mặc định lấy các dữ liệu trả về
  const originalSend = res.send;
  let responseBody: any;

  // Ghi đè hàm res.send để lấy dữ liệu mà Controller chuẩn bị trả về cho Client
  res.send = function (data: any) {
    try {
      // Nếu data trả về là dạng chuỗi JSON string, parse ra rồi tiến hành ẩn thông tin nhạy cảm
      if (typeof data === 'string') responseBody = redactSensitiveData(JSON.parse(data));
      else responseBody = redactSensitiveData(data);
    } catch (e) {
      responseBody = data; // Giữ nguyên nếu dữ liệu không phải JSON (text thuần, html)
    }
    // Gọi lại hàm send gốc để Express hoàn tất việc gửi trả dữ liệu về trình duyệt của Client
    return originalSend.apply(this, [data]);
  };

  // Lắng nghe sự kiện "finish" - Kích hoạt khi phản hồi đã được gửi đi hoàn toàn tới Client
  res.on("finish", async () => {
    const duration = Date.now() - start; // Tính toán tổng thời gian xử lý (ms)
    const { statusCode } = res;

    // In log thông báo: Request đã được xử lý và phản hồi ĐI RA (<--)
    logger.info(`<-- ${method} ${originalUrl} ${statusCode} ${duration}ms`, { requestId });

    try {
      let actualUserId: string | null = null;
      let actualSubjectId: string | null = null;

      // Dựa trên thông tin giải mã từ Auth Middleware để truy vấn ID thực tế trong CSDL
      //Nếu client request là user
      if (req.account?.type === 'USER') {
        const user = await getUserByAccountId(req.account.id);
        actualUserId = user?.id || null;
      }

      //Nếu client request là subject
      if (req.account?.type === 'SUBJECT') {
        const subject = await getSubjectByAccountId(req.account.id);
        actualSubjectId = subject?.id || null;
      }

      //Lấy dữ liệu đã gửi lên và làm sạch để lưu log
      const sanitizedRequest = {
        body: redactSensitiveData(req.body),
        query: redactSensitiveData(req.query),
        params: redactSensitiveData(req.params),
      };

      //Lưu vết chi tiết hành động HTTP này vào bảng SystemLog trong CSDL
      await createSystemLog({
        category: 'HTTP_REQUEST',
        action: `${method} ${originalUrl}`,
        status_code: statusCode,
        duration_ms: duration,
        ip_address: ip,
        user_agent: userAgent,
        //chỉ chèn trường user/subject nếu tìm thấy ID thực tế
        ...(actualUserId && {
          user: {
            connect: { id: actualUserId } // Connect relation trong Prisma
          }
        }),
        ...(actualSubjectId && {
          subject: {
            connect: { id: actualSubjectId }
          }
        }),
        old_data: JSON.parse(JSON.stringify(sanitizedRequest)),
        // Lưu trữ dữ liệu response  vào cột lưu dữ liệu thay đổi dưới dạng JSON
        new_data: typeof responseBody === 'object' ? JSON.parse(JSON.stringify(responseBody)) : { data: responseBody }
      });
    } catch (dbError) {
      // Nếu việc lưu log vào Database thất bại , ghi log lỗi ra
      logger.error("Failed to write HTTP log to SystemLog", { requestId, error: dbError });
    }
  });

  // Chuyển quyền điều khiển sang middleware kế tiếp hoặc controller xử lý logic chính
  next();
};