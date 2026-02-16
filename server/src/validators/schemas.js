import Joi from 'joi';

const id = Joi.string().trim().min(1).required();
const page = Joi.number().integer().min(1);
const limit = Joi.number().integer().min(1).max(100);
const status = Joi.string().trim().valid('active', 'completed');
const courseTitle = Joi.string().trim().min(3).max(200);
const courseDescription = Joi.string().max(5000).allow('', null);
const coursePrice = Joi.alternatives().try(
  Joi.number().min(0).max(999999.99),
  Joi.string().trim().pattern(/^\d+(\.\d{1,2})?$/)
);
const isBoolean = Joi.boolean();
const lessonTitle = Joi.string().trim().min(3).max(200);
const lessonYoutubeUrl = Joi.string().trim().allow('', null);
const lessonContent = Joi.string().max(50000).allow('', null);
const lessonOrderIndex = Joi.number().integer().min(0);
const fileName = Joi.string().trim().min(1).max(255);
const fileType = Joi.string().trim().min(1).max(255);
const fileSize = Joi.number().integer().min(1).max(10 * 1024 * 1024);

export const validationSchemas = {
  auth: {
    register: {
      body: Joi.object({
        name: Joi.string().trim().min(1).max(255).required(),
        email: Joi.string().trim().email().required(),
        password: Joi.string().min(1).required(),
        role: Joi.string().trim().valid('learner', 'instructor', 'admin').optional(),
      }),
    },
    registerInstructor: {
      body: Joi.object({
        name: Joi.string().trim().min(1).max(255).required(),
        email: Joi.string().trim().email().required(),
        password: Joi.string().min(1).required(),
      }),
    },
    registerAdmin: {
      body: Joi.object({
        name: Joi.string().trim().min(1).max(255).required(),
        email: Joi.string().trim().email().required(),
        password: Joi.string().min(1).required(),
      }),
    },
    login: {
      body: Joi.object({
        email: Joi.string().trim().email().required(),
        password: Joi.string().min(1).required(),
      }),
    },
    refresh: {
      body: Joi.object({}),
      query: Joi.object({}),
    },
    logout: {
      body: Joi.object({}),
      query: Joi.object({}),
    },
  },
  ai: {
    generateQuiz: {
      body: Joi.object({
        lesson_text: Joi.string().trim().min(1).required(),
        num_questions: Joi.number().integer().min(1).max(20).optional(),
      }),
    },
  },
  certificates: {
    generate: {
      params: Joi.object({
        courseId: id,
      }),
    },
    download: {
      params: Joi.object({
        id,
      }),
    },
  },
  courses: {
    list: {
      query: Joi.object({
        page,
        limit,
        search: Joi.string().trim().min(1).max(255),
        is_free: isBoolean,
        is_published: isBoolean,
        instructor_id: Joi.string().trim().min(1),
        sort_by: Joi.string().trim().valid('created_at', 'title', 'price', 'updated_at'),
        sort_order: Joi.string().trim().valid('asc', 'desc'),
        include_deleted: isBoolean,
      }),
    },
    listInstructorCourses: {
      query: Joi.object({
        page,
        limit,
        is_published: isBoolean,
        include_deleted: isBoolean,
      }),
    },
    idParam: {
      params: Joi.object({
        id,
      }),
    },
    create: {
      body: Joi.object({
        title: courseTitle.required(),
        description: courseDescription.optional(),
        price: coursePrice.optional(),
        is_free: isBoolean.optional(),
        is_published: isBoolean.optional(),
      }),
    },
    update: {
      params: Joi.object({
        id,
      }),
      body: Joi.object({
        title: courseTitle.optional(),
        description: courseDescription.optional(),
        price: coursePrice.optional(),
        is_free: isBoolean.optional(),
        is_published: isBoolean.optional(),
      }).min(1),
    },
    enrollments: {
      params: Joi.object({
        id,
      }),
      query: Joi.object({
        page,
        limit,
        status,
      }),
    },
    enroll: {
      params: Joi.object({
        id,
      }),
    },
  },
  lessons: {
    courseParam: {
      params: Joi.object({
        courseId: id,
      }),
    },
    lessonParams: {
      params: Joi.object({
        courseId: id,
        lessonId: id,
      }),
    },
    create: {
      params: Joi.object({
        courseId: id,
      }),
      body: Joi.object({
        title: lessonTitle.required(),
        youtube_url: lessonYoutubeUrl.optional(),
        order_index: lessonOrderIndex.optional(),
        content_text: lessonContent.optional(),
      }),
    },
    update: {
      params: Joi.object({
        courseId: id,
        lessonId: id,
      }),
      body: Joi.object({
        title: lessonTitle.optional(),
        youtube_url: lessonYoutubeUrl.optional(),
        order_index: lessonOrderIndex.optional(),
        content_text: lessonContent.optional(),
      }).min(1),
    },
    reorder: {
      params: Joi.object({
        courseId: id,
      }),
      body: Joi.object({
        lesson_ids: Joi.array().items(Joi.string().trim().min(1)).min(1).required(),
      }),
    },
  },
  enrollments: {
    list: {
      query: Joi.object({
        page,
        limit,
        status,
      }),
    },
  },
  instructor: {
    courseIdParam: {
      params: Joi.object({
        id,
      }),
    },
    courseResourceParams: {
      params: Joi.object({
        id,
        resourceId: id,
      }),
    },
    listCourses: {
      query: Joi.object({
        page,
        limit,
        is_published: isBoolean,
        include_deleted: isBoolean,
      }),
    },
    createCourse: {
      body: Joi.object({
        title: courseTitle.required(),
        description: courseDescription.optional(),
        price: coursePrice.optional(),
        is_free: isBoolean.optional(),
        is_published: isBoolean.optional(),
      }),
    },
    updateCourse: {
      params: Joi.object({
        id,
      }),
      body: Joi.object({
        title: courseTitle.optional(),
        description: courseDescription.optional(),
        price: coursePrice.optional(),
        is_free: isBoolean.optional(),
        is_published: isBoolean.optional(),
      }).min(1),
    },
    listEnrollments: {
      params: Joi.object({
        id,
      }),
      query: Joi.object({
        page,
        limit,
        status,
      }),
    },
    listResources: {
      params: Joi.object({
        id,
      }),
      query: Joi.object({
        page,
        limit,
      }),
    },
    uploadResource: {
      params: Joi.object({
        id,
      }),
      body: Joi.object({
        file_name: fileName.required(),
        file_type: fileType.optional(),
        file_size: fileSize.required(),
      }),
    },
  },
  payments: {
    createOrder: {
      body: Joi.object({
        course_id: id,
        dodo_product_id: Joi.string().trim().min(1).required(),
        quantity: Joi.number().integer().min(1).optional(),
        return_url: Joi.string().uri().optional().allow('', null),
      }),
    },
    webhook: {
      headers: Joi.object({
        'webhook-id': Joi.string().trim().required(),
        'webhook-signature': Joi.string().trim().required(),
        'webhook-timestamp': Joi.string().trim().required(),
      }),
    },
  },
  progress: {
    lessonIdParam: {
      params: Joi.object({
        id,
      }),
    },
    courseIdParam: {
      params: Joi.object({
        courseId: id,
      }),
    },
  },
  resources: {
    idParam: {
      params: Joi.object({
        id,
      }),
    },
    upload: {
      body: Joi.object({
        course_id: id,
        file_name: fileName.required(),
        file_type: fileType.optional(),
        file_size: fileSize.required(),
      }),
    },
  },
};
