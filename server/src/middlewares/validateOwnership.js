import { isResourceOwner, ROLES } from '../utils/permissions.js';
import { AuthError, BadRequestError, ForbiddenError } from '../errors/index.js';

export function validateOwnership(resourceType, paramName = 'id') {
  return async (req, res, next) => {
    if (!req.user) {
      throw new AuthError('Authentication required');
    }

    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    if (req.user.role !== ROLES.INSTRUCTOR) {
      throw new ForbiddenError('Instructor access required');
    }

    const resourceId = req.params[paramName] || req.body[paramName];

    if (!resourceId) {
      throw new BadRequestError('Resource ID required');
    }

    const isOwner = await isResourceOwner(req.user.sub, resourceType, resourceId);

    if (!isOwner) {
      throw new ForbiddenError('You do not own this resource');
    }

    next();
  };
}

export function validateCourseOwnership(paramName = 'courseId') {
  return validateOwnership('course', paramName);
}

export function validateSectionOwnership(paramName = 'sectionId') {
  return validateOwnership('section', paramName);
}

export function validateContentOwnership(paramName = 'contentId') {
  return validateOwnership('content', paramName);
}

export function validateQuizOwnership(paramName = 'quizId') {
  return validateOwnership('quiz', paramName);
}

export function validateLessonOwnership(paramName = 'lessonId') {
  return validateOwnership('lesson', paramName);
}
