// role.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AccountPayload } from '../types/data.js';
import { prisma } from '../configs/prisma.js';

/**
 * Middleware to attach the user's role to the request object.
 * It expects that `authMiddleware` has already populated `req.account`.
 * The role is read from `req.account.role` (if present) or from a custom
 * claim `role` inside the JWT payload.
 *
 * If the role cannot be determined, the request proceeds with undefined role –
 * downstream route handlers can decide whether to allow or forbid the action.
 */
export const roleMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  const account = (req as any).account as AccountPayload | undefined;

  if (!account?.id || account.type !== 'USER') {
    req.role = undefined;
    req.roles = [];
    return next();
  }

  try {
    const userAccount = await prisma.account.findUnique({
      where: { id: account.id },
      select: {
        user: {
          select: {
            userRole: {
              select: {
                role: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    const roles = userAccount?.user?.userRole.map((userRole) => userRole.role.name) ?? [];
    req.roles = roles;
    req.role = roles[0];
    return next();
  } catch (error) {
    return next(error);
  }
};

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const normalizedAllowedRoles = allowedRoles.map((role) => role.toUpperCase());
    const userRoles = (req.roles ?? []).map((role) => role.toUpperCase());

    if (userRoles.some((role) => normalizedAllowedRoles.includes(role))) {
      return next();
    }
    // If role missing or not allowed, forbid
    // Using generic 403 response; adjust as needed
    const res = _res as any;
    res.status(403).json({ message: 'Forbidden: insufficient privileges' });
  };
};
