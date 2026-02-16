import { v4 as uuid } from 'uuid';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../db/db.js';
import { courses, enrollments, lesson_progress, lessons, payments, resources } from '../db/schema.js';
import {
  buildResourceS3Key,
  createSignedDownloadUrl,
  createSignedUploadUrl,
  getS3BucketName,
  isS3Configured,
  removeS3Object,
} from '../utils/s3.js';

const VALID_ENROLLMENT_STATUSES = ['active', 'completed'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['pdf', 'doc', 'docx']);
const EXTENSION_TO_MIME = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
const ALLOWED_MIME_TYPES = new Set(Object.values(EXTENSION_TO_MIME));

function parsePagination(query) {
  const parsedPage = Number.parseInt(query.page ?? '1', 10);
  const parsedLimit = Number.parseInt(query.limit ?? '10', 10);
  const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
  const limit = Number.isNaN(parsedLimit) ? 10 : Math.min(100, Math.max(1, parsedLimit));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

function parseStatusFilter(query) {
  if (query.status === undefined) {
    return null;
  }

  const status = String(query.status).toLowerCase();

  if (!VALID_ENROLLMENT_STATUSES.includes(status)) {
    return { error: 'status must be one of: active, completed' };
  }

  return { status };
}

function getFileExtension(fileName) {
  if (typeof fileName !== 'string') {
    return null;
  }

  const segments = fileName.toLowerCase().trim().split('.');
  if (segments.length < 2) {
    return null;
  }

  return segments.pop();
}

function normalizeUploadRequest({ file_name: fileName, file_type: fileType, file_size: fileSize }) {
  const errors = [];

  if (!fileName || typeof fileName !== 'string' || !fileName.trim()) {
    errors.push('file_name is required');
  }

  const extension = getFileExtension(fileName);
  if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
    errors.push('Only pdf, doc, and docx files are allowed');
  }

  const parsedSize = Number(fileSize);
  if (!Number.isInteger(parsedSize) || parsedSize <= 0) {
    errors.push('file_size must be a positive integer');
  } else if (parsedSize > MAX_FILE_SIZE_BYTES) {
    errors.push('Maximum allowed file size is 10MB');
  }

  const normalizedMimeType =
    typeof fileType === 'string' && fileType.trim()
      ? fileType.trim().toLowerCase()
      : extension
        ? EXTENSION_TO_MIME[extension]
        : null;

  if (!normalizedMimeType || !ALLOWED_MIME_TYPES.has(normalizedMimeType)) {
    errors.push('Invalid file_type for allowed file types');
  }

  if (extension && normalizedMimeType && EXTENSION_TO_MIME[extension] !== normalizedMimeType) {
    errors.push('file_type does not match file extension');
  }

  return {
    errors,
    normalizedMimeType,
    parsedSize,
    normalizedFileName: fileName?.trim(),
  };
}

async function getOwnedCourse(courseId, instructorId) {
  return db.query.courses.findFirst({
    where: and(
      eq(courses.id, courseId),
      eq(courses.instructor_id, instructorId),
      isNull(courses.deleted_at)
    ),
  });
}

export async function getInstructorCourseAnalytics(req, res) {
  const { id: courseId } = req.params;
  const instructorId = req.user.sub;

  const course = await getOwnedCourse(courseId, instructorId);

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const [enrollmentStatsResult, lessonCountResult, resourceCountResult, progressStatsResult, revenueStatsResult] = await Promise.all([
    db
      .select({
        total: sql`count(*)`,
        active: sql`coalesce(sum(case when ${enrollments.status} = 'active' then 1 else 0 end), 0)`,
        completed: sql`coalesce(sum(case when ${enrollments.status} = 'completed' then 1 else 0 end), 0)`,
      })
      .from(enrollments)
      .where(eq(enrollments.course_id, courseId)),
    db
      .select({ count: sql`count(*)` })
      .from(lessons)
      .where(eq(lessons.course_id, courseId)),
    db
      .select({ count: sql`count(*)` })
      .from(resources)
      .where(eq(resources.course_id, courseId)),
    db
      .select({
        average_progress_pct: sql`coalesce(avg(${lesson_progress.progress_pct}), 0)`,
        completed_progress_records: sql`coalesce(sum(case when ${lesson_progress.completed} = true then 1 else 0 end), 0)`,
      })
      .from(lesson_progress)
      .where(eq(lesson_progress.course_id, courseId)),
    db
      .select({
        total_revenue: sql`coalesce(sum(case when ${payments.status} = 'success' then ${payments.amount} else 0 end), 0)`,
      })
      .from(payments)
      .where(eq(payments.course_id, courseId)),
  ]);

  const totalEnrollments = Number(enrollmentStatsResult[0]?.total ?? 0);
  const activeEnrollments = Number(enrollmentStatsResult[0]?.active ?? 0);
  const completedEnrollments = Number(enrollmentStatsResult[0]?.completed ?? 0);
  const lessonsCount = Number(lessonCountResult[0]?.count ?? 0);
  const resourcesCount = Number(resourceCountResult[0]?.count ?? 0);
  const averageProgressPct = Number(progressStatsResult[0]?.average_progress_pct ?? 0);
  const completedProgressRecords = Number(progressStatsResult[0]?.completed_progress_records ?? 0);
  const totalRevenue = Number(revenueStatsResult[0]?.total_revenue ?? 0);
  const completionRate = totalEnrollments > 0
    ? Number(((completedEnrollments / totalEnrollments) * 100).toFixed(2))
    : 0;

  return res.json({
    course: {
      id: course.id,
      title: course.title,
      is_published: course.is_published,
      created_at: course.created_at,
      updated_at: course.updated_at,
    },
    stats: {
      total_enrollments: totalEnrollments,
      active_enrollments: activeEnrollments,
      completed_enrollments: completedEnrollments,
      enrollment_completion_rate: completionRate,
      lessons_count: lessonsCount,
      resources_count: resourcesCount,
      average_progress_pct: Number(averageProgressPct.toFixed(2)),
      completed_progress_records: completedProgressRecords,
      total_revenue: Number(totalRevenue.toFixed(2)),
    },
  });
}

export async function listInstructorCourseResources(req, res) {
  const { id: courseId } = req.params;
  const instructorId = req.user.sub;
  const { page, limit, offset } = parsePagination(req.query);

  const course = await getOwnedCourse(courseId, instructorId);

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const [resourceRows, countResult] = await Promise.all([
    db.query.resources.findMany({
      where: eq(resources.course_id, courseId),
      orderBy: [desc(resources.created_at)],
      limit,
      offset,
    }),
    db
      .select({ count: sql`count(*)` })
      .from(resources)
      .where(eq(resources.course_id, courseId)),
  ]);

  const total = Number(countResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limit);

  return res.json({
    course: {
      id: course.id,
      title: course.title,
      instructor_id: course.instructor_id,
    },
    resources: resourceRows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}

export async function generateInstructorResourceUploadUrl(req, res) {
  if (!isS3Configured()) {
    return res.status(500).json({ error: 'S3 is not configured' });
  }

  const { id: courseId } = req.params;
  const instructorId = req.user.sub;
  const { file_name: fileName, file_type: fileType, file_size: fileSize } = req.body;

  const course = await getOwnedCourse(courseId, instructorId);

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const validation = normalizeUploadRequest({
    file_name: fileName,
    file_type: fileType,
    file_size: fileSize,
  });

  if (validation.errors.length > 0) {
    return res.status(400).json({ errors: validation.errors });
  }

  const resourceId = uuid();
  const bucket = getS3BucketName();
  const s3Key = buildResourceS3Key(courseId, resourceId, validation.normalizedFileName);

  const { url, expiresIn } = await createSignedUploadUrl({
    bucket,
    key: s3Key,
    contentType: validation.normalizedMimeType,
  });

  await db.insert(resources).values({
    id: resourceId,
    course_id: courseId,
    uploader_id: instructorId,
    file_name: validation.normalizedFileName,
    file_type: validation.normalizedMimeType,
    file_size: validation.parsedSize,
    s3_key: s3Key,
    s3_bucket: bucket,
  });

  return res.status(201).json({
    resource_id: resourceId,
    upload_url: url,
    expires_in: expiresIn,
    method: 'PUT',
    required_headers: {
      'Content-Type': validation.normalizedMimeType,
    },
    resource: {
      id: resourceId,
      course_id: courseId,
      file_name: validation.normalizedFileName,
      file_type: validation.normalizedMimeType,
      file_size: validation.parsedSize,
    },
  });
}

export async function deleteInstructorCourseResource(req, res) {
  if (!isS3Configured()) {
    return res.status(500).json({ error: 'S3 is not configured' });
  }

  const { id: courseId, resourceId } = req.params;
  const instructorId = req.user.sub;

  const course = await getOwnedCourse(courseId, instructorId);

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const resource = await db.query.resources.findFirst({
    where: and(eq(resources.id, resourceId), eq(resources.course_id, courseId)),
  });

  if (!resource) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  await removeS3Object({
    bucket: resource.s3_bucket,
    key: resource.s3_key,
  });

  await db.delete(resources).where(eq(resources.id, resourceId));

  return res.json({ message: 'Resource deleted' });
}

export async function generateInstructorCourseResourceDownloadUrl(req, res) {
  if (!isS3Configured()) {
    return res.status(500).json({ error: 'S3 is not configured' });
  }

  const { id: courseId, resourceId } = req.params;
  const instructorId = req.user.sub;

  const course = await getOwnedCourse(courseId, instructorId);

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const resource = await db.query.resources.findFirst({
    where: and(eq(resources.id, resourceId), eq(resources.course_id, courseId)),
  });

  if (!resource) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  const { url, expiresIn } = await createSignedDownloadUrl({
    bucket: resource.s3_bucket,
    key: resource.s3_key,
    fileName: resource.file_name,
    contentType: resource.file_type,
  });

  return res.json({
    resource_id: resource.id,
    download_url: url,
    expires_in: expiresIn,
    resource: {
      id: resource.id,
      course_id: resource.course_id,
      file_name: resource.file_name,
      file_type: resource.file_type,
      file_size: resource.file_size,
      created_at: resource.created_at,
    },
  });
}

export async function getInstructorCourseEnrollments(req, res) {
  const { id: courseId } = req.params;
  const instructorId = req.user.sub;
  const { page, limit, offset } = parsePagination(req.query);
  const statusFilter = parseStatusFilter(req.query);

  if (statusFilter?.error) {
    return res.status(400).json({ error: statusFilter.error });
  }

  const course = await getOwnedCourse(courseId, instructorId);

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const conditions = [eq(enrollments.course_id, courseId)];

  if (statusFilter?.status) {
    conditions.push(eq(enrollments.status, statusFilter.status));
  }

  const whereClause = and(...conditions);

  const [enrollmentRows, countResult] = await Promise.all([
    db.query.enrollments.findMany({
      where: whereClause,
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [desc(enrollments.enrolled_at)],
      limit,
      offset,
    }),
    db
      .select({ count: sql`count(*)` })
      .from(enrollments)
      .where(whereClause),
  ]);

  const total = Number(countResult[0].count);
  const totalPages = Math.ceil(total / limit);

  return res.json({
    course: {
      id: course.id,
      title: course.title,
      instructor_id: course.instructor_id,
    },
    enrollments: enrollmentRows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      course_id: row.course_id,
      status: row.status,
      enrolled_at: row.enrolled_at,
      user: row.user,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}
