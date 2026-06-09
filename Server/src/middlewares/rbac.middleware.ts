import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../exceptions/http-exception';
import { UserAccountRole } from '../../generated/prisma/client';

/**
 * Middleware factory to check if a user has one of the required roles.
 * This is a Role-Based Access Control (RBAC) middleware.
 *
 * @param requiredRoles An array of roles that are allowed to access the route.
 * @returns An Express middleware function.
 */
export const checkRole = (requiredRoles: UserAccountRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // The authMiddleware should have already run and placed the payload on the request
      const accountId = req.account?.id;

      if (!accountId) {
        // This should technically not be reached if authMiddleware is always used before this
        return next(new HttpException(401, 'Authentication required'));
      }

      const userRole = req.account?.type;

      if (!userRole) {
        return next(new HttpException(403, 'Forbidden: User role not found or account is not a USER type'));
      }

      // Check if the user's role is in the list of required roles
      if (requiredRoles.includes(userRole)) {
        // User has the required role, proceed to the next middleware/handler
        next();
      } else {
        // User does not have the required role, deny access
        return next(new HttpException(403, 'Forbidden: You do not have the required permissions'));
      }
    } catch (error) {
      next(new HttpException(500, 'Internal server error during role check'));
    }
  };
};
