import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { lessons } from '../db/schema.js';
import { verifyCourseEnrollmentAccess } from '../services/enrollment.service.js';
import { AuthError, BadRequestError, NotFoundError, AppError } from '../errors/index.js';

export function requireCourseEnrollment(paramName = 'courseId') {
  return async (req, res, next) => {
    if (!req.user) {
      throw new AuthError('Authentication required');
    }

    const courseId = req.params[paramName] || req.body[paramName];

    if (!courseId) {
      throw new BadRequestError('Course ID required');
    }

    const access = await verifyCourseEnrollmentAccess({
      userId: req.user.sub,
      userRole: req.user.role,
      courseId,
    });

    if (!access.allowed) {
      throw new AppError(access.message, {
        statusCode: access.statusCode,
        code: access.statusCode === 404 ? 'NOT_FOUND' : 'FORBIDDEN',
      });
    }

    req.course = access.course;
    req.enrollment = access.enrollment;

    next();
  };
}

export function requireLessonEnrollment(paramName = 'id') {
  return async (req, res, next) => {
    if (!req.user) {
      throw new AuthError('Authentication required');
    }

    const lessonId = req.params[paramName] || req.body[paramName];

    if (!lessonId) {
      throw new BadRequestError('Lesson ID required');
    }

    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
    });

    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    const access = await verifyCourseEnrollmentAccess({
      userId: req.user.sub,
      userRole: req.user.role,
      courseId: lesson.course_id,
    });

    if (!access.allowed) {
      throw new AppError(access.message, {
        statusCode: access.statusCode,
        code: access.statusCode === 404 ? 'NOT_FOUND' : 'FORBIDDEN',
      });
    }

    req.course = access.course;
    req.enrollment = access.enrollment;
    req.lesson = lesson;

    next();
  };
}
