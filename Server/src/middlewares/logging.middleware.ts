import { Request, Response, NextFunction } from "express";
import { prisma } from '../configs/prisma';
import { v4 as uuidv4 } from 'uuid';
import { logger } from "../utils/logger"

export const loggingMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  const requestId = uuidv4();

  // attach vào request để dùng ở mọi nơi
  req.requestId = requestId

  const { method, originalUrl } = req

  const ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    null

  const userAgent = req.headers["user-agent"] || null

  let requestBody = req.body

  if (requestBody?.password) {
    requestBody = { ...requestBody, password: "***" }
  }

  // intercept response
  const oldSend = res.send
  let responseBody: any

  res.send = function (body) {
    responseBody = body
    return oldSend.call(this, body)
  }

  res.on("finish", async () => {
    const duration = Date.now() - start

    try {
      await prisma.requestLog.create({
        data: {
          id: requestId,
          user_id: (req as any).user?.id || null,
          method,
          path: originalUrl,
          status_code: res.statusCode,
          duration_ms: duration,
          ip_address: ip?.toString(),
          user_agent: userAgent,
          device_id: (req as any).deviceId || null,
          request_body: requestBody,
          response_body: safeParseJSON(responseBody)
        }
      })
    } catch (err) {
      logger.error("RequestLog DB error", { err })
    }

    logger.info("HTTP Request", {
      requestId,
      method,
      path: originalUrl,
      status: res.statusCode,
      duration
    })
  })

  next()
}

function safeParseJSON(data: any) {
  try {
    if (typeof data === "string") return JSON.parse(data)
    return data
  } catch {
    return null
  }
}