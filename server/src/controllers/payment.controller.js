import { v4 as uuid } from 'uuid';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '../db/db.js';
import { courses, enrollments, payments, users } from '../db/schema.js';
import { getDodoPaymentsClient, getDodoWebhookKey } from '../utils/dodoPayments.js';
import { triggerEnrollmentRetryForPayment } from '../jobs/enrollmentRetry.job.js';

const PAYMENT_PROVIDER = 'dodo_payments';

const STATUS_BY_EVENT_TYPE = {
  'payment.processing': 'processing',
  'payment.succeeded': 'success',
  'payment.failed': 'failed',
  'payment.cancelled': 'cancelled',
};

const STATUS_BY_DODO_STATUS = {
  processing: 'processing',
  succeeded: 'success',
  failed: 'failed',
  cancelled: 'cancelled',
};

function asNonEmptyString(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toStoredAmount(totalAmount) {
  if (typeof totalAmount !== 'number' || Number.isNaN(totalAmount)) {
    return null;
  }

  return (totalAmount / 100).toFixed(2);
}

function resolvePaymentStatus(eventType, dodoStatus) {
  const fromType = STATUS_BY_EVENT_TYPE[eventType];
  if (fromType) {
    return fromType;
  }

  if (typeof dodoStatus === 'string') {
    return STATUS_BY_DODO_STATUS[dodoStatus] || 'processing';
  }

  return null;
}

function readWebhookBody(req) {
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8');
  }

  if (typeof req.body === 'string') {
    return req.body;
  }

  return null;
}

function normalizeWebhookHeaders(headers) {
  const neededHeaders = ['webhook-id', 'webhook-signature', 'webhook-timestamp'];
  const normalized = {};

  for (const key of neededHeaders) {
    const headerValue = headers[key];

    if (typeof headerValue === 'string' && headerValue.length > 0) {
      normalized[key] = headerValue;
      continue;
    }

    if (Array.isArray(headerValue) && headerValue.length > 0 && typeof headerValue[0] === 'string') {
      normalized[key] = headerValue[0];
    }
  }

  return normalized;
}

function extractMetadata(metadata) {
  return {
    userId: asNonEmptyString(metadata?.user_id) || asNonEmptyString(metadata?.userId),
    courseId: asNonEmptyString(metadata?.course_id) || asNonEmptyString(metadata?.courseId),
  };
}

async function findPaymentByDodoPaymentId(dodoPaymentId) {
  return db.query.payments.findFirst({
    where: eq(payments.dodo_payment_id, dodoPaymentId),
  });
}

async function findPaymentByDodoOrderId(dodoOrderId) {
  return db.query.payments.findFirst({
    where: eq(payments.dodo_order_id, dodoOrderId),
  });
}

async function persistWebhookPayment(event, status) {
  const dodoPaymentId = asNonEmptyString(event?.data?.payment_id);
  if (!dodoPaymentId) {
    return null;
  }

  const dodoOrderId = asNonEmptyString(event?.data?.checkout_session_id);
  const { userId, courseId } = extractMetadata(event?.data?.metadata);
  const amount = toStoredAmount(event?.data?.total_amount);

  const updateData = {
    status,
    provider: PAYMENT_PROVIDER,
    updated_at: new Date(),
  };

  if (dodoOrderId) {
    updateData.dodo_order_id = dodoOrderId;
  }

  if (amount !== null) {
    updateData.amount = amount;
  }

  const existingByPaymentId = await findPaymentByDodoPaymentId(dodoPaymentId);

  if (existingByPaymentId) {
    await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, existingByPaymentId.id));

    return db.query.payments.findFirst({
      where: eq(payments.id, existingByPaymentId.id),
    });
  }

  if (dodoOrderId) {
    const existingByOrderId = await findPaymentByDodoOrderId(dodoOrderId);

    if (existingByOrderId) {
      await db
        .update(payments)
        .set({
          ...updateData,
          dodo_payment_id: dodoPaymentId,
        })
        .where(eq(payments.id, existingByOrderId.id));

      return db.query.payments.findFirst({
        where: eq(payments.id, existingByOrderId.id),
      });
    }
  }

  if (!userId || !courseId) {
    return null;
  }

  const id = uuid();

  try {
    await db.insert(payments).values({
      id,
      user_id: userId,
      course_id: courseId,
      amount,
      provider: PAYMENT_PROVIDER,
      status,
      dodo_order_id: dodoOrderId,
      dodo_payment_id: dodoPaymentId,
      updated_at: new Date(),
    });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      const duplicate = await findPaymentByDodoPaymentId(dodoPaymentId);
      if (duplicate) {
        await db
          .update(payments)
          .set(updateData)
          .where(eq(payments.id, duplicate.id));

        return db.query.payments.findFirst({
          where: eq(payments.id, duplicate.id),
        });
      }
    }

    throw error;
  }

  return db.query.payments.findFirst({
    where: eq(payments.id, id),
  });
}

export async function createDodoOrder(req, res) {
  const userId = req.user?.sub;
  const { course_id: courseId, dodo_product_id: dodoProductId, quantity = 1, return_url: returnUrl } = req.body || {};
  const parsedQuantity = Number(quantity);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const normalizedCourseId = asNonEmptyString(courseId);
  const normalizedProductId = asNonEmptyString(dodoProductId);

  if (!normalizedCourseId || !normalizedProductId) {
    return res.status(400).json({ error: 'course_id and dodo_product_id are required' });
  }

  if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
    return res.status(400).json({ error: 'quantity must be a positive integer' });
  }

  const [course, user, existingEnrollment] = await Promise.all([
    db.query.courses.findFirst({
      where: and(eq(courses.id, normalizedCourseId), isNull(courses.deleted_at)),
    }),
    db.query.users.findFirst({
      where: eq(users.id, userId),
    }),
    db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.user_id, userId),
        eq(enrollments.course_id, normalizedCourseId),
        inArray(enrollments.status, ['active', 'completed'])
      ),
    }),
  ]);

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (existingEnrollment) {
    return res.status(409).json({ error: 'User is already enrolled in this course' });
  }

  if (course.is_free) {
    return res.status(400).json({ error: 'This course does not require payment' });
  }

  try {
    const dodoClient = getDodoPaymentsClient();

    const checkoutSession = await dodoClient.checkoutSessions.create({
      product_cart: [{ product_id: normalizedProductId, quantity: parsedQuantity }],
      customer: {
        email: user.email,
        name: user.name || undefined,
      },
      metadata: {
        user_id: userId,
        course_id: normalizedCourseId,
      },
      return_url: asNonEmptyString(returnUrl) || asNonEmptyString(process.env.DODO_DEFAULT_RETURN_URL),
    });

    const paymentRecordId = uuid();

    await db.insert(payments).values({
      id: paymentRecordId,
      user_id: userId,
      course_id: normalizedCourseId,
      amount: course.price,
      provider: PAYMENT_PROVIDER,
      status: 'pending',
      dodo_order_id: checkoutSession.session_id,
      updated_at: new Date(),
    });

    return res.status(201).json({
      message: 'Dodo order created',
      order: {
        dodo_order_id: checkoutSession.session_id,
        checkout_url: checkoutSession.checkout_url,
      },
    });
  } catch (error) {
    const statusCode = typeof error?.status === 'number' ? error.status : 500;

    return res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
      error: 'Failed to create Dodo order',
      details: error instanceof Error ? error.message : 'Unexpected error',
    });
  }
}

export async function handleDodoWebhook(req, res) {
  const payload = readWebhookBody(req);

  if (!payload) {
    return res.status(400).json({ error: 'Webhook payload is required' });
  }

  const headers = normalizeWebhookHeaders(req.headers);

  if (!headers['webhook-id'] || !headers['webhook-signature'] || !headers['webhook-timestamp']) {
    return res.status(400).json({ error: 'Missing webhook signature headers' });
  }

  let event;

  try {
    const dodoClient = getDodoPaymentsClient();

    event = dodoClient.webhooks.unwrap(payload, {
      headers,
      key: getDodoWebhookKey(),
    });
  } catch {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const status = resolvePaymentStatus(event?.type, event?.data?.status);

  if (!status) {
    return res.status(200).json({ received: true });
  }

  try {
    const paymentRecord = await persistWebhookPayment(event, status);

    if (paymentRecord && status === 'success') {
      await triggerEnrollmentRetryForPayment(paymentRecord.id);
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unexpected error',
    });
  }

  return res.status(200).json({ received: true });
}
