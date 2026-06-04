import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from '../configs/env';
import * as accountRepository from '../repositories/account.repository';
import { Account } from "../../generated/prisma/client";

// Extend the Express Request type to include our custom properties
declare global {
    namespace Express {
        interface Request {
            account?: Account;          // The full, fresh user account object from DB
            tokenPayload?: JwtPayload; // The original payload from the JWT
            requestId?: string;         // A unique ID for tracing the request
        }
    }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as JwtPayload;

        if (typeof decoded !== 'object' || !decoded.id) {
            return res.status(401).json({ message: "Unauthorized: Invalid token payload" });
        }

        const account = await accountRepository.findById(decoded.id);

        if (!account) {
            return res.status(401).json({ message: "Unauthorized: Account not found" });
        }

        if (account.status !== 'ACTIVE') {
            return res.status(403).json({ 
                message: `Forbidden: Account is ${account.status.toLowerCase()}` 
            });
        }

        // Attach rich, up-to-date context to the request for downstream middlewares
        req.account = account;          // Fresh account data from DB
        req.tokenPayload = decoded;     // Contextual data from token (like device_id)

        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Unauthorized: Token has expired" });
        }
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }
        return res.status(500).json({ message: "Internal Server Error" });
    }
};