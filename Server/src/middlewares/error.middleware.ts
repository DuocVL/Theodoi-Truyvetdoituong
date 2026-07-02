import { Request, Response, NextFunction } from "express";
import { HttpException } from "../exceptions/http-exception";
import { logger } from "../utils/log-helper";
import { env } from "../configs/env";

//Midddlewaare xử lý lỗi, xử lý cuối cùng 

//
export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction //cần tham số next để Express biết đây là trình xử lý lỗi 
) => {

  //Lấy lỗi nếu là lỗi tự tạo thì lấy nó không thì báo lỗi server
  const status = err instanceof HttpException ? err.status : 500;
  const message = err instanceof HttpException ? err.message : "An unexpected error occurred.";

  //Ghi log lỗi kèm đầy đủ thông tin
  logger.error("HTTP Error", {
    //thông tin lõi của lỗi
    error: {
      message: err.message, //thông điệp lỗi
      stack: err.stack,     //dòng code gây lỗi
    },

    //các thông tin của request gây lỗi
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    //thông tin client gửi request nếu đi qua authMiddleware
    accountId: req.account?.id,
    deviceId: req.account?.device_id,
  });

  //trả về tùy môi trường nếu là development trả về cả stack lỗi
  if (env.NODE_ENV === "development") {
    return res.status(status).json({
      status: "error",
      message,
      stack: err.stack,//trả cả stack lỗi
    });
  }

  //Thực tế không trả về stack lỗi
  return res.status(status).json({
    status: "error",
    message: message,
  });
};
