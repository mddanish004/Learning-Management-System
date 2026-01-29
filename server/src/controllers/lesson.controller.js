import { db } from '../db/db.js';
import { lessons, lesson_progress, courses } from '../db/schema.js';
import { v4 as uuid } from 'uuid';
import { eq, and, isNull, asc, gt, gte, lt, lte, sql } from 'drizzle-orm';

const TITLE_MIN_LENGTH = 3;
const TITLE_MAX_LENGTH = 200;
const CONTENT_TEXT_MAX_LENGTH = 50000;

const YOUTUBE_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S*)?$/;

function extractYouTubeVideoId(url) {
  if (!url) return null;
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

function generateEmbedUrl(videoId) {
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

function validateLessonData(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Title is required');
    } else if (data.title.trim().length < TITLE_MIN_LENGTH) {
      errors.push(`Title must be at least ${TITLE_MIN_LENGTH} characters`);
    } else if (data.title.trim().length > TITLE_MAX_LENGTH) {
      errors.push(`Title must not exceed ${TITLE_MAX_LENGTH} characters`);
    }
  }

  if (data.youtube_url !== undefined && data.youtube_url !== null && data.youtube_url !== '') {
    const videoId = extractYouTubeVideoId(data.youtube_url);
    if (!videoId) {
      errors.push('Invalid YouTube URL. Supported formats: youtube.com/watch?v=ID, youtu.be/ID');
    }
  }

  if (data.content_text !== undefined && data.content_text !== null) {
    if (typeof data.content_text !== 'string') {
      errors.push('Content text must be a string');
    } else if (data.content_text.length > CONTENT_TEXT_MAX_LENGTH) {
      errors.push(`Content text must not exceed ${CONTENT_TEXT_MAX_LENGTH} characters`);
    }
  }

  if (data.order_index !== undefined && data.order_index !== null) {
    if (!Number.isInteger(data.order_index) || data.order_index < 0) {
      errors.push('Order index must be a non-negative integer');
    }
  }

  return errors;
}

function formatLessonResponse(lesson) {
  return {
    ...lesson,
    embed_url: generateEmbedUrl(lesson.youtube_video_id),
  };
}

export async function createLesson(req, res) {
  const { courseId } = req.params;
  const { title, youtube_url, order_index, content_text } = req.body;

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), isNull(courses.deleted_at)),
  });

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const errors = validateLessonData({ title, youtube_url, content_text, order_index });
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const videoId = extractYouTubeVideoId(youtube_url);
  const lessonId = uuid();

  let finalOrderIndex = order_index;
  if (finalOrderIndex === undefined || finalOrderIndex === null) {
    const maxOrderResult = await db
      .select({ maxOrder: sql`COALESCE(MAX(order_index), -1)` })
      .from(lessons)
      .where(eq(lessons.course_id, courseId));
    finalOrderIndex = Number(maxOrderResult[0].maxOrder) + 1;
  } else {
    await db
      .update(lessons)
      .set({ order_index: sql`order_index + 1` })
      .where(and(eq(lessons.course_id, courseId), gte(lessons.order_index, finalOrderIndex)));
  }

  await db.insert(lessons).values({
    id: lessonId,
    course_id: courseId,
    title: title.trim(),
    youtube_video_id: videoId,
    order_index: finalOrderIndex,
    content_text: content_text?.trim() || null,
  });

  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
  });

  res.status(201).json({ message: 'Lesson created', lesson: formatLessonResponse(lesson) });
}

export async function getLessons(req, res) {
  const { courseId } = req.params;

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), isNull(courses.deleted_at)),
  });

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const lessonList = await db.query.lessons.findMany({
    where: eq(lessons.course_id, courseId),
    orderBy: [asc(lessons.order_index)],
  });

  res.json({
    lessons: lessonList.map(formatLessonResponse),
  });
}

export async function getLessonById(req, res) {
  const { courseId, lessonId } = req.params;

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), isNull(courses.deleted_at)),
  });

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const lesson = await db.query.lessons.findFirst({
    where: and(eq(lessons.id, lessonId), eq(lessons.course_id, courseId)),
  });

  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  res.json({ lesson: formatLessonResponse(lesson) });
}

export async function updateLesson(req, res) {
  const { courseId, lessonId } = req.params;
  const { title, youtube_url, order_index, content_text } = req.body;

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), isNull(courses.deleted_at)),
  });

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const existingLesson = await db.query.lessons.findFirst({
    where: and(eq(lessons.id, lessonId), eq(lessons.course_id, courseId)),
  });

  if (!existingLesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  const errors = validateLessonData({ title, youtube_url, content_text, order_index }, true);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const updateData = { updated_at: new Date() };

  if (title !== undefined) {
    updateData.title = title.trim();
  }

  if (youtube_url !== undefined) {
    updateData.youtube_video_id = youtube_url ? extractYouTubeVideoId(youtube_url) : null;
  }

  if (content_text !== undefined) {
    updateData.content_text = content_text?.trim() || null;
  }

  if (order_index !== undefined && order_index !== existingLesson.order_index) {
    const oldIndex = existingLesson.order_index;
    const newIndex = order_index;

    if (newIndex > oldIndex) {
      await db
        .update(lessons)
        .set({ order_index: sql`order_index - 1` })
        .where(
          and(
            eq(lessons.course_id, courseId),
            gt(lessons.order_index, oldIndex),
            lte(lessons.order_index, newIndex)
          )
        );
    } else {
      await db
        .update(lessons)
        .set({ order_index: sql`order_index + 1` })
        .where(
          and(
            eq(lessons.course_id, courseId),
            gte(lessons.order_index, newIndex),
            lt(lessons.order_index, oldIndex)
          )
        );
    }

    updateData.order_index = newIndex;
  }

  await db.update(lessons).set(updateData).where(eq(lessons.id, lessonId));

  const updatedLesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
  });

  res.json({ message: 'Lesson updated', lesson: formatLessonResponse(updatedLesson) });
}

export async function deleteLesson(req, res) {
  const { courseId, lessonId } = req.params;

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), isNull(courses.deleted_at)),
  });

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const lesson = await db.query.lessons.findFirst({
    where: and(eq(lessons.id, lessonId), eq(lessons.course_id, courseId)),
  });

  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  const deletedOrderIndex = lesson.order_index;

  await db.delete(lesson_progress).where(eq(lesson_progress.lesson_id, lessonId));

  await db.delete(lessons).where(eq(lessons.id, lessonId));

  await db
    .update(lessons)
    .set({ order_index: sql`order_index - 1` })
    .where(and(eq(lessons.course_id, courseId), gt(lessons.order_index, deletedOrderIndex)));

  res.json({ message: 'Lesson deleted' });
}

export async function reorderLessons(req, res) {
  const { courseId } = req.params;
  const { lesson_ids } = req.body;

  if (!Array.isArray(lesson_ids) || lesson_ids.length === 0) {
    return res.status(400).json({ error: 'lesson_ids must be a non-empty array' });
  }

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), isNull(courses.deleted_at)),
  });

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const existingLessons = await db.query.lessons.findMany({
    where: eq(lessons.course_id, courseId),
  });

  const existingIds = new Set(existingLessons.map((l) => l.id));
  const invalidIds = lesson_ids.filter((id) => !existingIds.has(id));

  if (invalidIds.length > 0) {
    return res.status(400).json({ error: 'Invalid lesson IDs provided', invalid_ids: invalidIds });
  }

  const updates = lesson_ids.map((id, index) =>
    db.update(lessons).set({ order_index: index, updated_at: new Date() }).where(eq(lessons.id, id))
  );

  await Promise.all(updates);

  const reorderedLessons = await db.query.lessons.findMany({
    where: eq(lessons.course_id, courseId),
    orderBy: [asc(lessons.order_index)],
  });

  res.json({ message: 'Lessons reordered', lessons: reorderedLessons.map(formatLessonResponse) });
}
