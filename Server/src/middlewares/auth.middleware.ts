// auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from '../configs/env.js'
import { AccountPayload } from "../types/data.js";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (typeof decoded === 'object' && decoded !== null) {
      req.account = decoded as AccountPayload;
      next();
    } else {
      res.status(401).json({ message: "Invalid Token Payload" });
    }
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};