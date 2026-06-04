// role.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AccountPayload } from '../types/data.js';

/**
 * Middleware to attach the user's role to the request object.
 * It expects that `authMiddleware` has already populated `req.account`.
 * The role is read from `req.account.role` (if present) or from a custom
 * claim `role` inside the JWT payload.
 *
 * If the role cannot be determined, the request proceeds with undefined role –
 * downstream route handlers can decide whether to allow or forbid the action.
 */
export const roleMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const account = (req as any).account as AccountPayload | undefined;
  if (account && typeof account === 'object') {
    // Typical payload includes a `role` field. Adjust if your JWT uses a different name.
    (req as any).role = (account as any).role || undefined;
  }
  next();
};

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userRole = (req as any).role as string | undefined;
    if (userRole && allowedRoles.includes(userRole)) {
      return next();
    }
    // If role missing or not allowed, forbid
    // Using generic 403 response; adjust as needed
    const res = _res as any;
    res.status(403).json({ message: 'Forbidden: insufficient privileges' });
  };
};