import { AuthError, ForbiddenError } from '../errors/index.js';

export const ROLES = {
  LEARNER: 'learner',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin'
};

export function authorizeRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new AuthError('Authentication required');
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
}
