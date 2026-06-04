import { Request, Response, NextFunction } from "express";
import { HttpException } from "../exceptions/http-exception"; // Correctly imported
import { logger } from "../utils/logger";
import { env } from "../configs/env";

/**
 * The global error handling middleware. It should be the last middleware in the chain.
 * It catches all errors, logs them, and sends a standardized, safe response to the client.
 */
export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction // next is required for Express to recognize this as an error handler
) => {
  const status = err instanceof HttpException ? err.status : 500;
  const message = err instanceof HttpException ? err.message : "An unexpected error occurred.";

  // Log the error with all available context
  logger.error("HTTP Error", {
    // Core Info
    error: {
      message: err.message, // The original, detailed error message
      stack: err.stack,     // The stack trace for debugging
    },
    // Request Context
    requestId: req.requestId, // Crucial for tracing the request that caused the error
    method: req.method,
    path: req.originalUrl,
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    // User Context (if available)
    accountId: req.account?.id,
    deviceId: req.tokenPayload?.device_id,
  });

  // In a development environment, you might want to send the full error back
  if (env.NODE_ENV === "development") {
    return res.status(status).json({
      status: "error",
      message,
      stack: err.stack, // Be careful with this in production
    });
  }

  // In production, send a generic, safe response.
  // Do NOT leak implementation details like stack traces.
  return res.status(status).json({
    status: "error",
    message: message,
  });
};
