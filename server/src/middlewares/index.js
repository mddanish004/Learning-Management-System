export { authenticateJWT } from './authenticateJWT.js';
export { optionalAuth } from './optionalAuth.js';
export { authorizeRole, ROLES } from './authorizeRole.js';
export { rateLimitByUser } from './rateLimit.js';
export { attachCorrelationId } from './correlationId.js';
export { validateRequest } from './validateRequest.js';
export { errorHandler, notFoundHandler, normalizeLegacyErrorResponses } from './errorHandling.js';
export {
  validateOwnership,
  validateCourseOwnership,
  validateSectionOwnership,
  validateContentOwnership,
  validateQuizOwnership,
  validateLessonOwnership
} from './validateOwnership.js';
export { requireCourseEnrollment, requireLessonEnrollment } from './verifyEnrollment.js';
