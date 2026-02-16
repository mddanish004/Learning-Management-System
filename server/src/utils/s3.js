import 'dotenv/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const DEFAULT_SIGNED_URL_TTL_SECONDS = 900;

function getS3Region() {
  return process.env.AWS_REGION;
}

export function getS3BucketName() {
  return process.env.AWS_S3_BUCKET;
}

export function isS3Configured() {
  return Boolean(getS3Region() && getS3BucketName());
}

function buildS3Client() {
  const region = getS3Region();

  if (!region) {
    return null;
  }

  const hasStaticCredentials = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

  if (hasStaticCredentials) {
    return new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  return new S3Client({ region });
}

const s3Client = buildS3Client();

function ensureS3Ready() {
  if (!s3Client || !isS3Configured()) {
    throw new Error('S3 is not configured');
  }
}

function sanitizeFileName(fileName) {
  return fileName
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

function escapeFileNameForDisposition(fileName) {
  return fileName.replace(/"/g, '\\"');
}

export function buildResourceS3Key(courseId, resourceId, fileName) {
  const safeFileName = sanitizeFileName(fileName);
  return `courses/${courseId}/resources/${resourceId}/${Date.now()}-${safeFileName}`;
}

export function buildCertificateS3Key(courseId, userId, certificateId) {
  return `courses/${courseId}/certificates/${userId}/${certificateId}.pdf`;
}

export async function createSignedUploadUrl({
  bucket,
  key,
  contentType,
  expiresIn = DEFAULT_SIGNED_URL_TTL_SECONDS,
}) {
  ensureS3Ready();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return { url, expiresIn };
}

export async function uploadS3Object({
  bucket,
  key,
  body,
  contentType,
}) {
  ensureS3Ready();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);
}

export async function createSignedDownloadUrl({
  bucket,
  key,
  fileName,
  contentType,
  expiresIn = DEFAULT_SIGNED_URL_TTL_SECONDS,
}) {
  ensureS3Ready();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentType: contentType,
    ResponseContentDisposition: `attachment; filename="${escapeFileNameForDisposition(fileName)}"`,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return { url, expiresIn };
}

export async function removeS3Object({ bucket, key }) {
  ensureS3Ready();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3Client.send(command);
}
