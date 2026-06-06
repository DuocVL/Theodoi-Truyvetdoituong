import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from 'uuid';
import { logger } from "../utils/logger";
import { createRequestLog } from '../repositories/log.repository';

const SENSITIVE_FIELDS = new Set([
  'password',
  'newPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
]);

const redactSensitiveData = (value: unknown, seen = new WeakSet()): unknown => {
  if (Array.isArray(value)) {
    return value.map(item => redactSensitiveData(item, seen));
  }

  if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
    if (seen.has(value as object)) return '[Circular]';
    seen.add(value as object);

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        SENSITIVE_FIELDS.has(key) ? '[REDACTED]' : redactSensitiveData(item, seen),
      ])
    );
  }

  return value;
};

/**
 * Middleware ghi nhật ký (logging) toàn diện cho HTTP requests
 * 
 * Chức năng:
 * 1. Tạo requestId duy nhất cho mỗi request (dùng UUID)
 * 2. Ghi request details (method, URL, IP, user agent, body)
 * 3. Capture response details (status code, duration, response body)
 * 4. Ghi log vào database và console
 * 5. Sanitize sensitive data (password, token) trước khi log
 */
export const loggingMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //Bắt đầu đo thời gian request processing
  const start = Date.now();
  const requestId = uuidv4();
  
  // 📌Attach requestId vào request để dùng ở phần khác (error handler, etc)
  req.requestId = requestId;

  const { method, originalUrl, body } = req;

  // 🌐 Lấy IP address từ proxy headers hoặc socket connection
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || '').toString();
  const userAgent = req.headers["user-agent"] || 'unknown';

  // 🔐 Sanitize sensitive information từ request body trước khi log
  // Ví dụ: không log password, tokens, credit card, v.v.
  const sanitizedBody = redactSensitiveData(body);

  // 📝 Log request inlet (khi request vừa đến)
  logger.info(`--> ${method} ${originalUrl}`, {
    requestId,  // 🔗 Dùng requestId để track request này
    ip,
    userAgent,
    body: sanitizedBody,
  });

  /**
   * 🔥 Monkey-patch res.send để capture response body
   * 
   * Tại sao cần patch?
   * - Express middleware không có built-in hook để capture response body
   * - res.send() là điểm duy nhất response data được gửi
   * - Cần patch để log response content (không chỉ status code)
   */
  const originalSend = res.send;
  let responseBody: any;
  
  // ⚠️ Sử dụng arrow function để preserve 'this' context
  res.send = function (data: any) {
    try {
      // 🔍 Nếu response là string (likely JSON), parse nó
      if (typeof data === 'string') {
        try {
          responseBody = redactSensitiveData(JSON.parse(data));
        } catch (parseError) {
          // Nếu parse fail, giữ nguyên string
          responseBody = data;
        }
      } else if (Buffer.isBuffer(data)) {
        // 🔄 Nếu response là Buffer, convert to string rồi parse
        try {
          responseBody = redactSensitiveData(JSON.parse(data.toString()));
        } catch (parseError) {
          responseBody = data.toString();
        }
      } else {
        // Object / khác - keep as-is
        responseBody = redactSensitiveData(data);
      }
    } catch (e) {
      // 🛡️ Catch-all: nếu có lỗi gì, keep original data
      responseBody = data;
    }

    // ✅ Gọi original res.send() để gửi response cho client
    return originalSend.apply(this, [data]);
  };

  /**
   * 🏁 Hook khi response finish (response đã gửi hết về client)
   * 
   * Lý do dùng res.on("finish"):
   * - Đảm bảo response đã hoàn toàn được gửi trước khi log
   * - Có thể lấy duration chính xác
   * - Tránh lỗi "write after end" của response stream
   */
  res.on("finish", async () => {
    // ⏱️ Tính duration: từ khi nhận request đến khi response finish
    const duration = Date.now() - start;
    const { statusCode } = res;

    /**
     * 📤 Log response outlet (khi response hoàn thành)
     * Format: <-- METHOD URL STATUS_CODE DURATION
     * Ví dụ: <-- GET /api/users 200 45ms
     */
    logger.info(`<-- ${method} ${originalUrl} ${statusCode} ${duration}ms`, {
      requestId,
      statusCode,
      duration,
      responseBody: typeof responseBody === 'object' 
        ? JSON.stringify(responseBody).substring(0, 500) // Giới hạn 500 ký tự để log không quá dài
        : responseBody,
    });

    /**
     * 💾 Ghi request log vào database bất đồng bộ (async)
     * 
     * Tại sao async?
     * - DB write có thể mất thời gian
     * - Không muốn block response về client
     * - res.on("finish") được trigger sau khi response đã gửi
     * 
     * Tại sao không await ở middleware?
     * - Response đã gửi rồi, không cần chờ DB
     * - Nếu DB fail, không ảnh hưởng đến user
     */
    try {
      await createRequestLog({
        id: requestId,
        // ⚠️ RequestLog model có user_id (String), không phải account relation
        // Nếu req.account.type === "USER", user_id = user ID
        // Nếu req.account.type === "SUBJECT", user_id = null (subjects không có user profile)
        user_id: req.account?.id || null,
        method,
        path: originalUrl,
        status_code: statusCode,
        duration_ms: duration,
        ip_address: ip,
        user_agent: userAgent,
        // 📱 device_id dùng để track request từ device nào (mobile/web/etc)
        device_id: req.account?.device_id || null,
        response_body: responseBody, // Already parsed to JSON
      });
    } catch (dbError) {
      /**
       * 🚨 DB logging fail handling
       * 
       * Không throw lỗi vì:
       * - Response đã gửi cho client
       * - Không thể change response nữa
       * 
       * Chỉ log error để admin biết:
       * - DB connection có vấn đề?
       * - Disk space full?
       * - RequestLog table corrupted?
       */
      logger.error("Failed to write request log to database", { 
        requestId,
        error: dbError instanceof Error ? dbError.message : String(dbError),
        request: { method, path: originalUrl }
      });
    }
  });

  // ✅ Cho phép request tiếp tục tới controller layer
  next();
};
