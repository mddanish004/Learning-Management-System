import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../db/db.js';
import { courses, enrollments, users } from '../db/schema.js';
import { createEnrollmentIfNotExists, getCourseById } from '../services/enrollment.service.js';

const VALID_ENROLLMENT_STATUSES = ['active', 'completed'];

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

export async function enrollInFreeCourse(req, res) {
  const userId = req.user.sub;
  const courseId = req.params.id;

  const course = await getCourseById(courseId);

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  if (!course.is_published) {
    return res.status(400).json({ error: 'Course is not available for enrollment' });
  }

  if (!course.is_free) {
    return res.status(400).json({ error: 'This course requires payment' });
  }

  const result = await createEnrollmentIfNotExists({
    userId,
    courseId,
    status: 'active',
  });

  if (!result.enrollment) {
    return res.status(500).json({ error: 'Failed to enroll in course' });
  }

  return res.status(result.created ? 201 : 200).json({
    message: result.created ? 'Enrollment created' : 'Already enrolled',
    enrollment: result.enrollment,
    already_enrolled: !result.created,
  });
}

export async function listUserEnrollments(req, res) {
  const userId = req.user.sub;
  const { page, limit, offset } = parsePagination(req.query);
  const statusFilter = parseStatusFilter(req.query);

  if (statusFilter?.error) {
    return res.status(400).json({ error: statusFilter.error });
  }

  const conditions = [
    eq(enrollments.user_id, userId),
    isNull(courses.deleted_at),
  ];

  if (statusFilter?.status) {
    conditions.push(eq(enrollments.status, statusFilter.status));
  }

  const whereClause = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: enrollments.id,
        user_id: enrollments.user_id,
        course_id: enrollments.course_id,
        enrolled_at: enrollments.enrolled_at,
        status: enrollments.status,
        course_title: courses.title,
        course_description: courses.description,
        course_price: courses.price,
        course_is_free: courses.is_free,
        course_is_published: courses.is_published,
        instructor_id: users.id,
        instructor_name: users.name,
        instructor_email: users.email,
      })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.course_id))
      .leftJoin(users, eq(users.id, courses.instructor_id))
      .where(whereClause)
      .orderBy(desc(enrollments.enrolled_at))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql`count(*)` })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.course_id))
      .where(whereClause),
  ]);

  const total = Number(countResult[0].count);
  const totalPages = Math.ceil(total / limit);

  return res.json({
    enrollments: rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      course_id: row.course_id,
      status: row.status,
      enrolled_at: row.enrolled_at,
      course: {
        id: row.course_id,
        title: row.course_title,
        description: row.course_description,
        price: row.course_price,
        is_free: row.course_is_free,
        is_published: row.course_is_published,
        instructor: {
          id: row.instructor_id,
          name: row.instructor_name,
          email: row.instructor_email,
        },
      },
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

export async function listCourseEnrollments(req, res) {
  const courseId = req.params.id;
  const { page, limit, offset } = parsePagination(req.query);
  const statusFilter = parseStatusFilter(req.query);

  if (statusFilter?.error) {
    return res.status(400).json({ error: statusFilter.error });
  }

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), isNull(courses.deleted_at)),
  });

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
