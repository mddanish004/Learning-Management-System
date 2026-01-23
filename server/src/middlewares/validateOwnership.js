import { isResourceOwner, ROLES } from '../utils/permissions.js';

export function validateOwnership(resourceType, paramName = 'id') {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    if (req.user.role !== ROLES.INSTRUCTOR) {
      return res.status(403).json({ error: 'Instructor access required' });
    }

    const resourceId = req.params[paramName] || req.body[paramName];

    if (!resourceId) {
      return res.status(400).json({ error: 'Resource ID required' });
    }

    const isOwner = await isResourceOwner(req.user.sub, resourceType, resourceId);

    if (!isOwner) {
      return res.status(403).json({ error: 'You do not own this resource' });
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
