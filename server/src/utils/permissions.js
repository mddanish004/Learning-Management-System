import { db } from '../db/db.js';
import { courses, sections, content, quizzes, lessons } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export const ROLES = {
  LEARNER: 'learner',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin'
};

export function hasRole(user, role) {
  return user?.role === role;
}

export function hasAnyRole(user, roles) {
  return roles.includes(user?.role);
}

export function isAdmin(user) {
  return hasRole(user, ROLES.ADMIN);
}

export function isInstructor(user) {
  return hasRole(user, ROLES.INSTRUCTOR);
}

export function isLearner(user) {
  return hasRole(user, ROLES.LEARNER);
}

export function canManageCourse(user) {
  return hasAnyRole(user, [ROLES.INSTRUCTOR, ROLES.ADMIN]);
}

export async function isResourceOwner(userId, resourceType, resourceId) {
  switch (resourceType) {
    case 'course':
      return await isCourseOwner(userId, resourceId);
    case 'section':
      return await isSectionOwner(userId, resourceId);
    case 'content':
      return await isContentOwner(userId, resourceId);
    case 'quiz':
      return await isQuizOwner(userId, resourceId);
    case 'lesson':
      return await isLessonOwner(userId, resourceId);
    default:
      return false;
  }
}

export async function isCourseOwner(userId, courseId) {
  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), eq(courses.instructor_id, userId)),
  });
  return !!course;
}

export async function isSectionOwner(userId, sectionId) {
  const section = await db.query.sections.findFirst({
    where: eq(sections.id, sectionId),
    with: { course: true },
  });
  return section?.course?.instructor_id === userId;
}

export async function isContentOwner(userId, contentId) {
  const contentItem = await db.query.content.findFirst({
    where: eq(content.id, contentId),
    with: { section: { with: { course: true } } },
  });
  return contentItem?.section?.course?.instructor_id === userId;
}

export async function isQuizOwner(userId, quizId) {
  const quiz = await db.query.quizzes.findFirst({
    where: eq(quizzes.id, quizId),
    with: { course: true },
  });
  return quiz?.course?.instructor_id === userId;
}

export async function isLessonOwner(userId, lessonId) {
  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: { course: true },
  });
  return lesson?.course?.instructor_id === userId;
}

export function addOwnershipFilter(queryBuilder, table, userId) {
  return queryBuilder.where(eq(table.instructor_id, userId));
}

export async function getCoursesByInstructor(instructorId) {
  return await db.query.courses.findMany({
    where: eq(courses.instructor_id, instructorId),
  });
}

export async function verifyCourseAccess(userId, courseId, userRole) {
  if (userRole === ROLES.ADMIN) {
    return true;
  }

  if (userRole === ROLES.INSTRUCTOR) {
    return await isCourseOwner(userId, courseId);
  }

  return false;
}
