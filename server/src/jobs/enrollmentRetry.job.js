import { and, eq, isNull, lte, lt, or } from 'drizzle-orm';
import { db } from '../db/db.js';
import { payments } from '../db/schema.js';
import { createEnrollmentIfNotExists } from '../services/enrollment.service.js';

const RETRY_INTERVAL_MS = Number(process.env.PAYMENT_ENROLLMENT_RETRY_INTERVAL_MS || 30000);
const BASE_BACKOFF_MS = Number(process.env.PAYMENT_ENROLLMENT_RETRY_BACKOFF_MS || 30000);
const MAX_RETRY_COUNT = Number(process.env.PAYMENT_ENROLLMENT_MAX_RETRIES || 8);
const PROCESS_BATCH_SIZE = Number(process.env.PAYMENT_ENROLLMENT_RETRY_BATCH_SIZE || 25);

let retryJobTimer = null;
let retryJobRunning = false;
let retryJobDisabled = false;

function isPaymentSchemaMismatchError(error) {
  const code = error?.code || error?.cause?.code;
  if (code !== 'ER_BAD_FIELD_ERROR') {
    return false;
  }
  const message = String(error?.message || error?.cause?.message || '');
  return message.includes('payment_status') || message.includes('status');
}

function nextRetryAt(retryCount) {
  if (retryCount >= MAX_RETRY_COUNT) {
    return null;
  }

  const delay = Math.min(BASE_BACKOFF_MS * (2 ** Math.max(retryCount - 1, 0)), 30 * 60 * 1000);
  return new Date(Date.now() + delay);
}

async function markEnrollmentCreated(paymentId) {
  await db
    .update(payments)
    .set({
      enrollment_created: true,
      last_enrollment_error: null,
      next_enrollment_retry_at: null,
      updated_at: new Date(),
    })
    .where(eq(payments.id, paymentId));
}

async function markEnrollmentRetry(paymentRecord, errorMessage) {
  const retryCount = paymentRecord.enrollment_retry_count + 1;

  await db
    .update(payments)
    .set({
      enrollment_retry_count: retryCount,
      next_enrollment_retry_at: nextRetryAt(retryCount),
      last_enrollment_error: errorMessage,
      updated_at: new Date(),
    })
    .where(eq(payments.id, paymentRecord.id));
}

async function attemptEnrollmentForPayment(paymentRecord) {
  try {
    if (!paymentRecord.user_id || !paymentRecord.course_id) {
      throw new Error('Missing user_id or course_id in payment record');
    }

    await createEnrollmentIfNotExists({
      userId: paymentRecord.user_id,
      courseId: paymentRecord.course_id,
      status: 'active',
    });

    await markEnrollmentCreated(paymentRecord.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Enrollment creation failed';
    await markEnrollmentRetry(paymentRecord, message);
  }
}

export async function triggerEnrollmentRetryForPayment(paymentId) {
  const paymentRecord = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
  });

  if (!paymentRecord) {
    return;
  }

  if (paymentRecord.status !== 'success' || paymentRecord.enrollment_created) {
    return;
  }

  await attemptEnrollmentForPayment(paymentRecord);
}

export async function runEnrollmentRetryJob() {
  if (retryJobRunning || retryJobDisabled) {
    return;
  }

  retryJobRunning = true;

  try {
    const now = new Date();

    let duePayments = [];
    try {
      duePayments = await db.query.payments.findMany({
        where: and(
          eq(payments.status, 'success'),
          eq(payments.enrollment_created, false),
          lt(payments.enrollment_retry_count, MAX_RETRY_COUNT),
          or(
            isNull(payments.next_enrollment_retry_at),
            lte(payments.next_enrollment_retry_at, now)
          )
        ),
        orderBy: (p, { asc }) => [asc(p.created_at)],
        limit: PROCESS_BATCH_SIZE,
      });
    } catch (error) {
      if (isPaymentSchemaMismatchError(error)) {
        retryJobDisabled = true;
        if (retryJobTimer) {
          clearInterval(retryJobTimer);
          retryJobTimer = null;
        }
        return;
      }
      throw error;
    }

    for (const paymentRecord of duePayments) {
      await attemptEnrollmentForPayment(paymentRecord);
    }
  } finally {
    retryJobRunning = false;
  }
}

export function startEnrollmentRetryJob() {
  if (retryJobTimer || retryJobDisabled) {
    return;
  }

  retryJobTimer = setInterval(() => {
    runEnrollmentRetryJob().catch((error) => {
      console.error('Enrollment retry job failed:', error);
    });
  }, RETRY_INTERVAL_MS);

  runEnrollmentRetryJob().catch((error) => {
    console.error('Enrollment retry job failed:', error);
  });
}

export function stopEnrollmentRetryJob() {
  if (!retryJobTimer) {
    return;
  }

  clearInterval(retryJobTimer);
  retryJobTimer = null;
}
