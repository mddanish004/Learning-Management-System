import { db } from '../db/db.js';
import { courses, enrollments, users } from '../db/schema.js';
import { v4 as uuid } from 'uuid';
import { eq, and, like, isNull, sql, desc, asc } from 'drizzle-orm';

const TITLE_MIN_LENGTH = 3;
const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 5000;
const MIN_PRICE = 0;
const MAX_PRICE = 999999.99;

function validateCourseData(data, isUpdate = false) {
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

  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.length > DESCRIPTION_MAX_LENGTH) {
      errors.push(`Description must not exceed ${DESCRIPTION_MAX_LENGTH} characters`);
    }
  }

  if (data.price !== undefined && data.price !== null) {
    const price = parseFloat(data.price);
    if (isNaN(price)) {
      errors.push('Price must be a valid number');
    } else if (price < MIN_PRICE) {
      errors.push(`Price must be at least ${MIN_PRICE}`);
    } else if (price > MAX_PRICE) {
      errors.push(`Price must not exceed ${MAX_PRICE}`);
    }
  }

  if (data.is_free !== undefined && typeof data.is_free !== 'boolean') {
    errors.push('is_free must be a boolean');
  }

  if (data.is_published !== undefined && typeof data.is_published !== 'boolean') {
    errors.push('is_published must be a boolean');
  }

  return errors;
}

export async function createCourse(req, res) {
  const { title, description, price, is_free, is_published } = req.body;
  const instructorId = req.user.sub;

  const errors = validateCourseData({ title, description, price, is_free, is_published });
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const courseId = uuid();
  const isFree = is_free !== undefined ? is_free : (parseFloat(price) === 0 || price === undefined);

  await db.insert(courses).values({
    id: courseId,
    instructor_id: instructorId,
    title: title.trim(),
    description: description?.trim() || null,
    price: isFree ? "0.00" : (price || "0.00"),
    is_free: isFree,
    is_published: is_published || false,
  });

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
  });

  res.status(201).json({ message: 'Course created', course });
}

export async function getCourses(req, res) {
  const {
    page = 1,
    limit = 10,
    search,
    is_free,
    is_published,
    instructor_id,
    sort_by = 'created_at',
    sort_order = 'desc',
    include_deleted = false,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];

  if (!include_deleted || include_deleted === 'false') {
    conditions.push(isNull(courses.deleted_at));
  }

  if (search) {
    conditions.push(like(courses.title, `%${search}%`));
  }

  if (is_free !== undefined) {
    conditions.push(eq(courses.is_free, is_free === 'true'));
  }

  if (is_published !== undefined) {
    conditions.push(eq(courses.is_published, is_published === 'true'));
  }

  if (instructor_id) {
    conditions.push(eq(courses.instructor_id, instructor_id));
  }

  const validSortFields = ['created_at', 'title', 'price', 'updated_at'];
  const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
  const sortDirection = sort_order === 'asc' ? asc : desc;

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [courseList, countResult] = await Promise.all([
    db.query.courses.findMany({
      where: whereClause,
      with: {
        instructor: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [sortDirection(courses[sortField])],
      limit: limitNum,
      offset: offset,
    }),
    db
      .select({ count: sql`count(*)` })
      .from(courses)
      .where(whereClause),
  ]);

  const totalCount = Number(countResult[0].count);
  const totalPages = Math.ceil(totalCount / limitNum);

  res.json({
    courses: courseList,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    },
  });
}

export async function getCourseById(req, res) {
  const { id } = req.params;
  const userId = req.user?.sub;

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, id), isNull(courses.deleted_at)),
    with: {
      instructor: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      sections: {
        with: {
          content: true,
        },
        orderBy: (sections, { asc }) => [asc(sections.order_no)],
      },
    },
  });

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  let enrollmentStatus = null;
  if (userId) {
    const enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.user_id, userId),
        eq(enrollments.course_id, id)
      ),
    });
    enrollmentStatus = enrollment ? enrollment.status : null;
  }

  const enrollmentCount = await db
    .select({ count: sql`count(*)` })
    .from(enrollments)
    .where(eq(enrollments.course_id, id));

  res.json({
    course: {
      ...course,
      enrollment_count: Number(enrollmentCount[0].count),
      user_enrollment_status: enrollmentStatus,
      is_enrolled: !!enrollmentStatus,
    },
  });
}

export async function updateCourse(req, res) {
  const { id } = req.params;
  const { title, description, price, is_free, is_published } = req.body;

  const existingCourse = await db.query.courses.findFirst({
    where: and(eq(courses.id, id), isNull(courses.deleted_at)),
  });

  if (!existingCourse) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const errors = validateCourseData({ title, description, price, is_free, is_published }, true);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const updateData = { updated_at: new Date() };

  if (title !== undefined) {
    updateData.title = title.trim();
  }

  if (description !== undefined) {
    updateData.description = description?.trim() || null;
  }

  if (price !== undefined) {
    updateData.price = price;
  }

  if (is_free !== undefined) {
    updateData.is_free = is_free;
    if (is_free) {
      updateData.price = "0.00";
    }
  }

  if (is_published !== undefined) {
    updateData.is_published = is_published;
  }

  await db.update(courses).set(updateData).where(eq(courses.id, id));

  const updatedCourse = await db.query.courses.findFirst({
    where: eq(courses.id, id),
  });

  res.json({ message: 'Course updated', course: updatedCourse });
}

export async function deleteCourse(req, res) {
  const { id } = req.params;

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, id), isNull(courses.deleted_at)),
  });

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const enrollmentCount = await db
    .select({ count: sql`count(*)` })
    .from(enrollments)
    .where(eq(enrollments.course_id, id));

  const hasEnrollments = Number(enrollmentCount[0].count) > 0;

  if (course.is_published && hasEnrollments) {
    await db
      .update(courses)
      .set({ deleted_at: new Date(), is_published: false })
      .where(eq(courses.id, id));

    return res.json({ message: 'Course soft deleted (has enrollments)', soft_deleted: true });
  }

  await db.delete(courses).where(eq(courses.id, id));

  res.json({ message: 'Course permanently deleted', soft_deleted: false });
}

export async function getInstructorCourses(req, res) {
  const instructorId = req.user.sub;
  const {
    page = 1,
    limit = 10,
    is_published,
    include_deleted = false,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(courses.instructor_id, instructorId)];

  if (!include_deleted || include_deleted === 'false') {
    conditions.push(isNull(courses.deleted_at));
  }

  if (is_published !== undefined) {
    conditions.push(eq(courses.is_published, is_published === 'true'));
  }

  const whereClause = and(...conditions);

  const [courseList, countResult] = await Promise.all([
    db.query.courses.findMany({
      where: whereClause,
      orderBy: [desc(courses.created_at)],
      limit: limitNum,
      offset: offset,
    }),
    db
      .select({ count: sql`count(*)` })
      .from(courses)
      .where(whereClause),
  ]);

  const totalCount = Number(countResult[0].count);
  const totalPages = Math.ceil(totalCount / limitNum);

  res.json({
    courses: courseList,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    },
  });
}
