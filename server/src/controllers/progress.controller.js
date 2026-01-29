import { db } from '../db/db.js';
import { lessons, lesson_progress, enrollments, courses } from '../db/schema.js';
import { eq, and, isNull, sql } from 'drizzle-orm';

export async function markLessonComplete(req, res) {
  const { id: lessonId } = req.params;
  const userId = req.user.userId;

  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
  });

  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  const courseId = lesson.course_id;

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), isNull(courses.deleted_at)),
  });

  if (!course) {
    return res.status(404).json({ error: 'Course not found or has been deleted' });
  }

  const enrollment = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.user_id, userId),
      eq(enrollments.course_id, courseId),
      eq(enrollments.status, 'active')
    ),
  });

  if (!enrollment) {
    return res.status(403).json({ error: 'You must be enrolled in this course to mark lessons complete' });
  }

  const existingProgress = await db.query.lesson_progress.findFirst({
    where: and(
      eq(lesson_progress.user_id, userId),
      eq(lesson_progress.lesson_id, lessonId)
    ),
  });

  if (existingProgress) {
    if (existingProgress.completed) {
      return res.json({ message: 'Lesson already completed', progress: existingProgress });
    }

    await db
      .update(lesson_progress)
      .set({
        completed: true,
        progress_pct: 100,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(lesson_progress.user_id, userId),
          eq(lesson_progress.lesson_id, lessonId)
        )
      );
  } else {
    await db.insert(lesson_progress).values({
      user_id: userId,
      lesson_id: lessonId,
      course_id: courseId,
      completed: true,
      progress_pct: 100,
    });
  }

  const updatedProgress = await db.query.lesson_progress.findFirst({
    where: and(
      eq(lesson_progress.user_id, userId),
      eq(lesson_progress.lesson_id, lessonId)
    ),
  });

  res.json({ message: 'Lesson marked as complete', progress: updatedProgress });
}

export async function getCourseProgress(req, res) {
  const { courseId } = req.params;
  const userId = req.user.userId;

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), isNull(courses.deleted_at)),
  });

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const enrollment = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.user_id, userId),
      eq(enrollments.course_id, courseId)
    ),
  });

  if (!enrollment) {
    return res.status(403).json({ error: 'You must be enrolled in this course to view progress' });
  }

  const totalLessonsResult = await db
    .select({ count: sql`COUNT(*)` })
    .from(lessons)
    .where(eq(lessons.course_id, courseId));

  const totalLessons = Number(totalLessonsResult[0].count);

  if (totalLessons === 0) {
    return res.json({
      course_id: courseId,
      total_lessons: 0,
      completed_lessons: 0,
      completion_percentage: 0,
      lessons_progress: [],
    });
  }

  const activeLessonIds = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(eq(lessons.course_id, courseId));

  const activeLessonIdSet = new Set(activeLessonIds.map((l) => l.id));

  const userProgress = await db.query.lesson_progress.findMany({
    where: and(
      eq(lesson_progress.user_id, userId),
      eq(lesson_progress.course_id, courseId)
    ),
  });

  const validCompletedLessons = userProgress.filter(
    (p) => p.completed && activeLessonIdSet.has(p.lesson_id)
  );

  const completedLessons = validCompletedLessons.length;
  const completionPercentage = Math.round((completedLessons / totalLessons) * 100);

  const courseLessons = await db.query.lessons.findMany({
    where: eq(lessons.course_id, courseId),
    orderBy: (lessons, { asc }) => [asc(lessons.order_index)],
  });

  const progressMap = new Map(userProgress.map((p) => [p.lesson_id, p]));

  const lessonsProgress = courseLessons.map((lesson) => {
    const progress = progressMap.get(lesson.id);
    return {
      lesson_id: lesson.id,
      title: lesson.title,
      order_index: lesson.order_index,
      completed: progress?.completed || false,
      progress_pct: progress?.progress_pct || 0,
    };
  });

  res.json({
    course_id: courseId,
    total_lessons: totalLessons,
    completed_lessons: completedLessons,
    completion_percentage: completionPercentage,
    enrollment_status: enrollment.status,
    lessons_progress: lessonsProgress,
  });
}
