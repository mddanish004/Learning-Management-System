import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { lessons } from '../db/schema.js';
import { verifyCourseEnrollmentAccess } from '../services/enrollment.service.js';

export function requireCourseEnrollment(paramName = 'courseId') {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const courseId = req.params[paramName] || req.body[paramName];

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID required' });
    }

    const access = await verifyCourseEnrollmentAccess({
      userId: req.user.sub,
      userRole: req.user.role,
      courseId,
    });

    if (!access.allowed) {
      return res.status(access.statusCode).json({ error: access.message });
    }

    req.course = access.course;
    req.enrollment = access.enrollment;

    next();
  };
}

export function requireLessonEnrollment(paramName = 'id') {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const lessonId = req.params[paramName] || req.body[paramName];

    if (!lessonId) {
      return res.status(400).json({ error: 'Lesson ID required' });
    }

    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const access = await verifyCourseEnrollmentAccess({
      userId: req.user.sub,
      userRole: req.user.role,
      courseId: lesson.course_id,
    });

    if (!access.allowed) {
      return res.status(access.statusCode).json({ error: access.message });
    }

    req.course = access.course;
    req.enrollment = access.enrollment;
    req.lesson = lesson;

    next();
  };
}
