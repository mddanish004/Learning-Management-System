import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { db } from '../db/db.js';
import { certificates, courses, enrollments, lesson_progress, lessons, users } from '../db/schema.js';
import { renderCertificatePdf } from '../utils/certificatePdf.js';
import {
  buildCertificateS3Key,
  createSignedDownloadUrl,
  getS3BucketName,
  isS3Configured,
  uploadS3Object,
} from '../utils/s3.js';

const CERTIFICATE_CONTENT_TYPE = 'application/pdf';

function sanitizeFileName(fileName) {
  return fileName
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

function buildCertificateFileName(courseTitle) {
  const title = typeof courseTitle === 'string' && courseTitle.trim() ? courseTitle.trim() : 'course';
  return `${sanitizeFileName(title)}-certificate.pdf`;
}

async function getCourseCompletion(userId, courseId) {
  const totalLessonsResult = await db
    .select({ count: sql`COUNT(*)` })
    .from(lessons)
    .where(eq(lessons.course_id, courseId));

  const totalLessons = Number(totalLessonsResult[0]?.count || 0);

  if (totalLessons === 0) {
    return {
      totalLessons: 0,
      completedLessons: 0,
      completionPercentage: 0,
    };
  }

  const activeLessonIds = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(eq(lessons.course_id, courseId));

  const activeLessonIdSet = new Set(activeLessonIds.map((item) => item.id));

  const progressRows = await db.query.lesson_progress.findMany({
    where: and(
      eq(lesson_progress.user_id, userId),
      eq(lesson_progress.course_id, courseId),
      eq(lesson_progress.completed, true)
    ),
  });

  const completedLessons = progressRows.filter((item) => activeLessonIdSet.has(item.lesson_id)).length;
  const completionPercentage = Math.round((completedLessons / totalLessons) * 100);

  return {
    totalLessons,
    completedLessons,
    completionPercentage,
  };
}

export async function generateCertificate(req, res) {
  if (!isS3Configured()) {
    return res.status(500).json({ error: 'S3 is not configured' });
  }

  const { courseId } = req.params;
  const userId = req.user.sub;

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), isNull(courses.deleted_at)),
  });

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const enrollment = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.user_id, userId),
      eq(enrollments.course_id, courseId),
      inArray(enrollments.status, ['active', 'completed'])
    ),
  });

  if (!enrollment) {
    return res.status(403).json({ error: 'You must be enrolled in this course to generate a certificate' });
  }

  const completion = await getCourseCompletion(userId, courseId);

  if (completion.totalLessons === 0 || completion.completionPercentage < 100) {
    return res.status(400).json({
      error: 'Certificate can only be generated after 100% lesson completion',
      progress: {
        total_lessons: completion.totalLessons,
        completed_lessons: completion.completedLessons,
        completion_percentage: completion.completionPercentage,
      },
    });
  }

  const existingCertificate = await db.query.certificates.findFirst({
    where: and(
      eq(certificates.user_id, userId),
      eq(certificates.course_id, courseId)
    ),
  });

  if (
    existingCertificate &&
    existingCertificate.s3_bucket &&
    existingCertificate.s3_key &&
    existingCertificate.file_name &&
    existingCertificate.file_type &&
    existingCertificate.file_size
  ) {
    return res.json({
      message: 'Certificate already generated',
      certificate: existingCertificate,
    });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  const certificateId = existingCertificate?.id || uuid();
  const issuedAt = new Date();
  const fileName = buildCertificateFileName(course.title);
  const bucket = getS3BucketName();
  const s3Key = buildCertificateS3Key(courseId, userId, certificateId);

  const pdfBuffer = await renderCertificatePdf({
    certificateId,
    learnerName: user?.name || user?.email || 'Learner',
    courseTitle: course.title,
    issuedAt,
  });

  await uploadS3Object({
    bucket,
    key: s3Key,
    body: pdfBuffer,
    contentType: CERTIFICATE_CONTENT_TYPE,
  });

  const certificateUrl = `s3://${bucket}/${s3Key}`;

  if (existingCertificate) {
    await db
      .update(certificates)
      .set({
        certificate_url: certificateUrl,
        file_name: fileName,
        file_type: CERTIFICATE_CONTENT_TYPE,
        file_size: pdfBuffer.length,
        s3_key: s3Key,
        s3_bucket: bucket,
        issued_at: issuedAt,
      })
      .where(eq(certificates.id, existingCertificate.id));
  } else {
    await db.insert(certificates).values({
      id: certificateId,
      user_id: userId,
      course_id: courseId,
      certificate_url: certificateUrl,
      file_name: fileName,
      file_type: CERTIFICATE_CONTENT_TYPE,
      file_size: pdfBuffer.length,
      s3_key: s3Key,
      s3_bucket: bucket,
      issued_at: issuedAt,
    });
  }

  const savedCertificate = await db.query.certificates.findFirst({
    where: and(
      eq(certificates.user_id, userId),
      eq(certificates.course_id, courseId)
    ),
  });

  res.status(201).json({
    message: 'Certificate generated',
    certificate: savedCertificate,
  });
}

export async function getCertificateBycourse(req, res) {
  const { courseId } = req.params;
  const userId = req.user.sub;

  const certificate = await db.query.certificates.findFirst({
    where: and(
      eq(certificates.user_id, userId),
      eq(certificates.course_id, courseId)
    ),
  });

  if (!certificate) {
    return res.status(404).json({ error: 'No certificate found for this course' });
  }

  res.json({ certificate });
}

export async function generateCertificateDownloadUrl(req, res) {
  if (!isS3Configured()) {
    return res.status(500).json({ error: 'S3 is not configured' });
  }

  const { id } = req.params;
  const userId = req.user.sub;

  const certificate = await db.query.certificates.findFirst({
    where: and(
      eq(certificates.id, id),
      eq(certificates.user_id, userId)
    ),
  });

  if (!certificate) {
    return res.status(404).json({ error: 'Certificate not found' });
  }

  if (!certificate.s3_bucket || !certificate.s3_key || !certificate.file_name || !certificate.file_type) {
    return res.status(409).json({ error: 'Certificate file metadata is incomplete' });
  }

  const { url, expiresIn } = await createSignedDownloadUrl({
    bucket: certificate.s3_bucket,
    key: certificate.s3_key,
    fileName: certificate.file_name,
    contentType: certificate.file_type,
  });

  res.json({
    certificate_id: certificate.id,
    download_url: url,
    expires_in: expiresIn,
    certificate: {
      id: certificate.id,
      course_id: certificate.course_id,
      issued_at: certificate.issued_at,
      file_name: certificate.file_name,
      file_type: certificate.file_type,
      file_size: certificate.file_size,
    },
  });
}
