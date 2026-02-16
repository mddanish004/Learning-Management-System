import { v4 as uuid } from 'uuid';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '../db/db.js';
import { courses, enrollments } from '../db/schema.js';

const ENROLLMENT_ACCESS_STATUSES = ['active', 'completed'];

function isDuplicateEnrollmentError(error) {
  if (!error) {
    return false;
  }

  if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
    return true;
  }

  if (error.cause?.code === 'ER_DUP_ENTRY' || error.cause?.errno === 1062) {
    return true;
  }

  return typeof error.message === 'string' && error.message.toLowerCase().includes('duplicate entry');
}

export async function getCourseById(courseId) {
  return db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), isNull(courses.deleted_at)),
  });
}

export async function getAccessibleEnrollment(userId, courseId) {
  return db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.user_id, userId),
      eq(enrollments.course_id, courseId),
      inArray(enrollments.status, ENROLLMENT_ACCESS_STATUSES)
    ),
  });
}

export async function createEnrollmentIfNotExists({ userId, courseId, status = 'active' }) {
  const enrollmentId = uuid();

  try {
    await db.insert(enrollments).values({
      id: enrollmentId,
      user_id: userId,
      course_id: courseId,
      status,
      enrolled_at: new Date(),
    });

    const enrollment = await db.query.enrollments.findFirst({
      where: eq(enrollments.id, enrollmentId),
    });

    return { enrollment, created: true };
  } catch (error) {
    if (!isDuplicateEnrollmentError(error)) {
      throw error;
    }

    const existingEnrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.user_id, userId),
        eq(enrollments.course_id, courseId)
      ),
    });

    return { enrollment: existingEnrollment || null, created: false };
  }
}

export async function verifyCourseEnrollmentAccess({ userId, userRole, courseId }) {
  const course = await getCourseById(courseId);

  if (!course) {
    return {
      allowed: false,
      statusCode: 404,
      message: 'Course not found',
      course: null,
      enrollment: null,
    };
  }

  if (userRole === 'admin') {
    return {
      allowed: true,
      statusCode: 200,
      message: null,
      course,
      enrollment: null,
    };
  }

  if (userRole === 'instructor' && course.instructor_id === userId) {
    return {
      allowed: true,
      statusCode: 200,
      message: null,
      course,
      enrollment: null,
    };
  }

  const enrollment = await getAccessibleEnrollment(userId, courseId);

  if (!enrollment) {
    return {
      allowed: false,
      statusCode: 403,
      message: 'Enrollment required to access this course content',
      course,
      enrollment: null,
    };
  }

  return {
    allowed: true,
    statusCode: 200,
    message: null,
    course,
    enrollment,
  };
}
