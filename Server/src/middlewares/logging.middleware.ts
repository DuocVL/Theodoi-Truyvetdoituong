import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from 'uuid';
import { logger } from "../utils/logger";
import { createRequestLog } from '../repositories/log.repository';

/**
 * A comprehensive logging middleware that captures request, response, and performance metrics.
 * It performs dual logging: a detailed log to the database and a concise log to the console/file.
 */
export const loggingMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  const requestId = uuidv4();
  req.requestId = requestId; // Attach for use in other parts of the app, like error handling

  const { method, originalUrl, body } = req;

  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || '').toString();
  const userAgent = req.headers["user-agent"] || 'unknown';

  // Sanitize sensitive information from the request body before logging
  let sanitizedBody = { ...body };
  if (sanitizedBody?.password) {
    sanitizedBody.password = "[REDACTED]";
  }

  // Create a child logger with the requestId to correlate all logs for this request
  const requestLogger = logger.child({ requestId });
  requestLogger.info(`--> ${method} ${originalUrl}`, {
    ip,
    userAgent,
    body: sanitizedBody,
  });

  // Monkey-patch res.send to capture the response body
  const originalSend = res.send;
  let responseBody: any;
  res.send = function (body) {
    try {
        // Only attempt to parse if it's a string (likely JSON)
        responseBody = typeof body === 'string' ? JSON.parse(body) : body;
    } catch (e) {
        responseBody = body; // if parsing fails, keep the original body
    }
    return originalSend.apply(this, arguments as any);
  };

  res.on("finish", async () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // Log the response to the console/file
    requestLogger.info(`<-- ${method} ${originalUrl} ${statusCode} ${duration}ms`, {
      statusCode,
      duration,
      responseBody
    });

    // Asynchronously log the detailed request record to the database
    try {
      await createRequestLog({
        id: requestId,
        // Safely access properties from the request object
        account: req.account ? { connect: { id: req.account.id } } : undefined,
        method,
        path: originalUrl,
        status_code: statusCode,
        duration_ms: duration,
        ip_address: ip,
        user_agent: userAgent,
        device_id: req.tokenPayload?.device_id || null,
        request_body: sanitizedBody,
        response_body: responseBody, // Already parsed
      });
    } catch (dbError) {
      // If DB logging fails, log the error itself, but don't crash the app
      logger.error("Failed to write request log to database", { 
        error: dbError,
        requestLog: { requestId } // Log minimal info for triage
      });
    }
  });

  next();
};
