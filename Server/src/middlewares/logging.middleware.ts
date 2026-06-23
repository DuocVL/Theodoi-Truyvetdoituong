import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from 'uuid';
import { logger } from "../utils/log-helper";
import { createSystemLog } from '../repositories/log.repository';
import { prisma } from "../configs/prisma";

const SENSITIVE_FIELDS = new Set([
  'password', 'newPassword', 'confirmPassword', 'token', 'accessToken', 'refreshToken',
]);

const redactSensitiveData = (value: unknown, seen = new WeakSet()): unknown => {
  if (Array.isArray(value)) return value.map(item => redactSensitiveData(item, seen));
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

export const loggingMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  const requestId = uuidv4();
  req.requestId = requestId;

  const { method, originalUrl, body } = req;
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || '').toString();
  const userAgent = req.headers["user-agent"] || 'unknown';

  const sanitizedBody = redactSensitiveData(body);

  logger.info(`--> ${method} ${originalUrl}`, { requestId, ip, userAgent });

  const originalSend = res.send;
  let responseBody: any;

  res.send = function (data: any) {
    try {
      if (typeof data === 'string') responseBody = redactSensitiveData(JSON.parse(data));
      else responseBody = redactSensitiveData(data);
    } catch (e) { responseBody = data; }
    return originalSend.apply(this, [data]);
  };

  res.on("finish", async () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    logger.info(`<-- ${method} ${originalUrl} ${statusCode} ${duration}ms`, { requestId });

    try {
      // Logic để tìm ID thực sự của User hoặc Subject
      let actualUserId: string | null = null;
      let actualSubjectId: string | null = null;

      if (req.account?.type === 'USER') {
        // Giả định bạn đã có logic lấy User từ Account trong Auth Middleware
        // Nếu chưa, hãy tìm theo account_id
        const user = await prisma.user.findUnique({ where: { account_id: req.account.id } });
        actualUserId = user?.id || null;
      }

      if (req.account?.type === 'SUBJECT') {
        const subject = await prisma.subject.findUnique({ where: { account_id: req.account.id } });
        actualSubjectId = subject?.id || null;
      }

      await createSystemLog({
        category: 'HTTP_REQUEST',
        action: `${method} ${originalUrl}`,
        status_code: statusCode,
        duration_ms: duration,
        ip_address: ip,
        user_agent: userAgent,
        ...(actualUserId && {
          user: {
            connect: {
              id: actualUserId
            }
          }
        }),

        ...(actualSubjectId && {
          subject: {
            connect: {
              id: actualSubjectId
            }
          }
        }),
        new_data: typeof responseBody === 'object' ? JSON.parse(JSON.stringify(responseBody)) : { data: responseBody }
      });
    } catch (dbError) {
      logger.error("Failed to write HTTP log to SystemLog", { requestId, error: dbError });
    }
  });

  next();
};