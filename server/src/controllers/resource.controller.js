import { v4 as uuid } from 'uuid';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '../db/db.js';
import { courses, enrollments, resources } from '../db/schema.js';
import { ROLES } from '../middlewares/authorizeRole.js';
import {
  buildResourceS3Key,
  createSignedDownloadUrl,
  createSignedUploadUrl,
  getS3BucketName,
  isS3Configured,
  removeS3Object,
} from '../utils/s3.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['pdf', 'doc', 'docx']);
const EXTENSION_TO_MIME = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
const ALLOWED_MIME_TYPES = new Set(Object.values(EXTENSION_TO_MIME));

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

async function getCourseIfAccessibleByUploader(courseId, userId, userRole) {
  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), isNull(courses.deleted_at)),
  });

  if (!course) {
    return { course: null, error: { status: 404, message: 'Course not found' } };
  }

  if (userRole === ROLES.ADMIN) {
    return { course, error: null };
  }

  if (course.instructor_id !== userId) {
    return { course: null, error: { status: 403, message: 'You do not own this course' } };
  }

  return { course, error: null };
}

async function canUserDownloadResource(userId, userRole, resource) {
  if (userRole === ROLES.ADMIN) {
    return true;
  }

  if (resource.course?.instructor_id === userId) {
    return true;
  }

  const enrollment = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.user_id, userId),
      eq(enrollments.course_id, resource.course_id),
      inArray(enrollments.status, ['active', 'completed'])
    ),
  });

  return Boolean(enrollment);
}

export async function listCourseResources(req, res) {
  const { courseId } = req.params;
  const userId = req.user.sub;
  const userRole = req.user.role;

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), isNull(courses.deleted_at)),
  });

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const isInstructorOrAdmin =
    userRole === ROLES.ADMIN || course.instructor_id === userId;

  if (!isInstructorOrAdmin) {
    const enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.user_id, userId),
        eq(enrollments.course_id, courseId),
        inArray(enrollments.status, ['active', 'completed'])
      ),
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'You must be enrolled in this course to view resources' });
    }
  }

  const resourceRows = await db.query.resources.findMany({
    where: eq(resources.course_id, courseId),
    orderBy: (resources, { desc }) => [desc(resources.created_at)],
  });

  res.json({
    course: {
      id: course.id,
      title: course.title,
    },
    resources: resourceRows,
  });
}

export async function generateResourceUploadUrl(req, res) {
  if (!isS3Configured()) {
    return res.status(500).json({ error: 'S3 is not configured' });
  }

  const { course_id: courseId, file_name: fileName, file_type: fileType, file_size: fileSize } = req.body;
  const userId = req.user.sub;
  const userRole = req.user.role;

  if (!courseId || typeof courseId !== 'string') {
    return res.status(400).json({ error: 'course_id is required' });
  }

  const validation = normalizeUploadRequest({
    file_name: fileName,
    file_type: fileType,
    file_size: fileSize,
  });

  if (validation.errors.length > 0) {
    return res.status(400).json({ errors: validation.errors });
  }

  const { error: courseAccessError } = await getCourseIfAccessibleByUploader(courseId, userId, userRole);

  if (courseAccessError) {
    return res.status(courseAccessError.status).json({ error: courseAccessError.message });
  }

  const resourceId = uuid();
  const bucket = getS3BucketName();
  const s3Key = buildResourceS3Key(courseId, resourceId, validation.normalizedFileName);

  const { url, expiresIn } = await createSignedUploadUrl({
    bucket,
    key: s3Key,
    contentType: validation.normalizedMimeType,
  });

  res.status(200).json({
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
      s3_key: s3Key,
      s3_bucket: bucket,
    },
  });
}

export async function confirmResourceUpload(req, res) {
  const { resource_id: resourceId, course_id: courseId, file_name: fileName, file_type: fileType, file_size: fileSize, s3_key: s3Key, s3_bucket: s3Bucket } = req.body;
  const userId = req.user.sub;
  const userRole = req.user.role;

  if (!courseId || !resourceId || !s3Key || !s3Bucket) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { error: courseAccessError } = await getCourseIfAccessibleByUploader(courseId, userId, userRole);
  if (courseAccessError) {
    return res.status(courseAccessError.status).json({ error: courseAccessError.message });
  }

  const expectedPrefix = `courses/${courseId}/resources/${resourceId}/`;
  if (!s3Key.startsWith(expectedPrefix)) {
    return res.status(400).json({ error: 'Invalid s3_key' });
  }

  const existing = await db.query.resources.findFirst({
    where: eq(resources.id, resourceId),
  });
  if (existing) {
    return res.json({ resource: existing });
  }

  await db.insert(resources).values({
    id: resourceId,
    course_id: courseId,
    uploader_id: userId,
    file_name: fileName,
    file_type: fileType,
    file_size: Number(fileSize),
    s3_key: s3Key,
    s3_bucket: s3Bucket,
  });

  const saved = await db.query.resources.findFirst({
    where: eq(resources.id, resourceId),
  });

  res.status(201).json({ resource: saved });
}

export async function generateResourceDownloadUrl(req, res) {
  if (!isS3Configured()) {
    return res.status(500).json({ error: 'S3 is not configured' });
  }

  const { id } = req.params;
  const userId = req.user.sub;
  const userRole = req.user.role;

  const resource = await db.query.resources.findFirst({
    where: eq(resources.id, id),
    with: {
      course: true,
    },
  });

  if (!resource || !resource.course || resource.course.deleted_at) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  const hasAccess = await canUserDownloadResource(userId, userRole, resource);

  if (!hasAccess) {
    return res.status(403).json({ error: 'You must be enrolled in this course to download this resource' });
  }

  const { url, expiresIn } = await createSignedDownloadUrl({
    bucket: resource.s3_bucket,
    key: resource.s3_key,
    fileName: resource.file_name,
    contentType: resource.file_type,
  });

  res.json({
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

export async function deleteResource(req, res) {
  if (!isS3Configured()) {
    return res.status(500).json({ error: 'S3 is not configured' });
  }

  const { id } = req.params;
  const userId = req.user.sub;
  const userRole = req.user.role;

  const resource = await db.query.resources.findFirst({
    where: eq(resources.id, id),
    with: {
      course: true,
    },
  });

  if (!resource || !resource.course || resource.course.deleted_at) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  const canDelete = userRole === ROLES.ADMIN || resource.course.instructor_id === userId;

  if (!canDelete) {
    return res.status(403).json({ error: 'You do not own this resource' });
  }

  await removeS3Object({
    bucket: resource.s3_bucket,
    key: resource.s3_key,
  });

  await db.delete(resources).where(eq(resources.id, id));

  res.json({ message: 'Resource deleted' });
}
