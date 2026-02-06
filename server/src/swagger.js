const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "LMS — Learning Management System API",
    version: "1.0.0",
    description:
      "Complete REST API for a Learning Management System supporting courses, lessons, progress tracking, and AI-powered quiz generation.\n\n" +
      "### Authentication\n" +
      "- **Access token** — obtained via `POST /api/auth/login` or `POST /api/auth/refresh`. Send as `Authorization: Bearer <token>`.\n" +
      "- **Refresh token** — stored in an HTTP-only cookie named `refresh_token`.\n\n" +
      "### User Roles\n" +
      "| Role | Capabilities |\n" +
      "|------|-------------|\n" +
      "| **learner** | Register, login, browse courses/lessons, track progress, AI quiz |\n" +
      "| **instructor** | All learner abilities + create/edit/delete own courses & lessons |\n" +
      "| **admin** | All instructor abilities + manage any course, register admins |",
    contact: {
      name: "Md Danish",
      url: "https://github.com/mddanish004/Learning-Management-System",
    },
    license: {
      name: "",
    },
  },
  servers: [
    {
      url: "/",
      description: "Current server",
    },
  ],
  tags: [
    {
      name: "Auth",
      description: "Registration, login, token refresh, and logout",
    },
    {
      name: "Courses",
      description: "CRUD operations for courses",
    },
    {
      name: "Lessons",
      description:
        "CRUD and reorder operations for lessons within a course",
    },
    {
      name: "Progress",
      description: "Lesson completion and course progress tracking",
    },
    {
      name: "AI",
      description: "AI-powered quiz generation (rate-limited)",
    },
  ],

  /* ─────────── Security Schemes ─────────── */
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Access token obtained from `POST /api/auth/login` or `POST /api/auth/refresh`.",
      },
      CookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "refresh_token",
        description:
          "HTTP-only refresh token cookie set by login/refresh endpoints.",
      },
    },

    /* ─────────── Reusable Schemas ─────────── */
    schemas: {
      /* ── Auth ── */
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: {
            type: "string",
            example: "John Doe",
            description: "User display name",
          },
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
            description: "Unique email address",
          },
          password: {
            type: "string",
            format: "password",
            example: "secureP@ss123",
            description: "Plain password (hashed server-side)",
          },
          role: {
            type: "string",
            enum: ["learner", "instructor"],
            default: "learner",
            description:
              "Account role. Must not be `admin` (use dedicated admin endpoint).",
          },
        },
      },
      RegisterInstructorRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Jane Instructor" },
          email: {
            type: "string",
            format: "email",
            example: "jane@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "secureP@ss123",
          },
        },
      },
      RegisterAdminRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Admin User" },
          email: {
            type: "string",
            format: "email",
            example: "admin@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "adminP@ss456",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "secureP@ss123",
          },
        },
      },
      AccessTokenResponse: {
        type: "object",
        properties: {
          accessToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
        },
      },

      /* ── Course ── */
      Instructor: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Jane Instructor" },
          email: {
            type: "string",
            format: "email",
            example: "jane@example.com",
          },
        },
      },
      Course: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          instructor_id: { type: "string", format: "uuid" },
          title: { type: "string", example: "Intro to Node.js" },
          description: {
            type: "string",
            nullable: true,
            example: "A comprehensive Node.js course",
          },
          price: { type: "string", example: "29.99" },
          is_free: { type: "boolean", example: false },
          is_published: { type: "boolean", example: true },
          created_at: {
            type: "string",
            format: "date-time",
            example: "2025-01-15T10:30:00.000Z",
          },
          updated_at: {
            type: "string",
            format: "date-time",
            example: "2025-01-16T08:00:00.000Z",
          },
          deleted_at: {
            type: "string",
            format: "date-time",
            nullable: true,
            example: null,
          },
          instructor: { $ref: "#/components/schemas/Instructor" },
        },
      },
      CourseDetail: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          instructor_id: { type: "string", format: "uuid" },
          title: { type: "string", example: "Intro to Node.js" },
          description: {
            type: "string",
            nullable: true,
            example: "A comprehensive Node.js course",
          },
          price: { type: "string", example: "29.99" },
          is_free: { type: "boolean", example: false },
          is_published: { type: "boolean", example: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
          deleted_at: {
            type: "string",
            format: "date-time",
            nullable: true,
          },
          instructor: { $ref: "#/components/schemas/Instructor" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                course_id: { type: "string", format: "uuid" },
                title: { type: "string" },
                order_no: { type: "integer" },
                content: { type: "array", items: { type: "object" } },
              },
            },
          },
          enrollment_count: { type: "integer", example: 42 },
          user_enrollment_status: {
            type: "string",
            nullable: true,
            enum: ["active", null],
            example: "active",
            description:
              "Present only when the request includes a valid access token",
          },
          is_enrolled: {
            type: "boolean",
            example: false,
            description:
              "Present only when the request includes a valid access token",
          },
        },
      },
      CreateCourseRequest: {
        type: "object",
        required: ["title"],
        properties: {
          title: {
            type: "string",
            minLength: 3,
            maxLength: 200,
            example: "Intro to Node.js",
          },
          description: {
            type: "string",
            maxLength: 5000,
            example: "A comprehensive Node.js course",
          },
          price: {
            type: "number",
            minimum: 0,
            maximum: 999999.99,
            example: 29.99,
          },
          is_free: { type: "boolean", example: false },
          is_published: { type: "boolean", default: false },
        },
      },
      UpdateCourseRequest: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 3, maxLength: 200 },
          description: { type: "string", maxLength: 5000 },
          price: { type: "number", minimum: 0, maximum: 999999.99 },
          is_free: {
            type: "boolean",
            description: "If true, price is set to 0",
          },
          is_published: { type: "boolean" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 100 },
          totalPages: { type: "integer", example: 10 },
          hasNext: { type: "boolean", example: true },
          hasPrev: { type: "boolean", example: false },
        },
      },

      /* ── Lesson ── */
      Lesson: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          course_id: { type: "string", format: "uuid" },
          title: { type: "string", example: "Getting Started with Express" },
          youtube_video_id: {
            type: "string",
            nullable: true,
            example: "dQw4w9WgXcQ",
          },
          order_index: { type: "integer", example: 0 },
          content_text: {
            type: "string",
            nullable: true,
            example: "In this lesson we will cover...",
          },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
          embed_url: {
            type: "string",
            nullable: true,
            example: "https://www.youtube.com/embed/dQw4w9WgXcQ",
          },
        },
      },
      CreateLessonRequest: {
        type: "object",
        required: ["title"],
        properties: {
          title: {
            type: "string",
            minLength: 3,
            maxLength: 200,
            example: "Getting Started with Express",
          },
          youtube_url: {
            type: "string",
            example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            description: "Valid YouTube URL (watch or youtu.be format)",
          },
          content_text: {
            type: "string",
            maxLength: 50000,
            example: "In this lesson we will cover...",
          },
          order_index: {
            type: "integer",
            minimum: 0,
            description: "Non-negative integer; default = append at end",
          },
        },
      },
      UpdateLessonRequest: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 3, maxLength: 200 },
          youtube_url: {
            type: "string",
            description: "Valid YouTube URL (watch or youtu.be format)",
          },
          content_text: { type: "string", maxLength: 50000 },
          order_index: { type: "integer", minimum: 0 },
        },
      },
      ReorderLessonsRequest: {
        type: "object",
        required: ["lesson_ids"],
        properties: {
          lesson_ids: {
            type: "array",
            items: { type: "string", format: "uuid" },
            description:
              "Ordered array of lesson UUIDs; must match all lessons in the course",
            example: [
              "550e8400-e29b-41d4-a716-446655440001",
              "550e8400-e29b-41d4-a716-446655440002",
            ],
          },
        },
      },

      /* ── Progress ── */
      Progress: {
        type: "object",
        properties: {
          user_id: { type: "string", format: "uuid" },
          lesson_id: { type: "string", format: "uuid" },
          course_id: { type: "string", format: "uuid" },
          progress_pct: { type: "number", example: 100 },
          completed: { type: "boolean", example: true },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      CourseProgress: {
        type: "object",
        properties: {
          course_id: { type: "string", format: "uuid" },
          total_lessons: { type: "integer", example: 10 },
          completed_lessons: { type: "integer", example: 3 },
          completion_percentage: { type: "number", example: 30 },
          enrollment_status: { type: "string", example: "active" },
          lessons_progress: {
            type: "array",
            items: {
              type: "object",
              properties: {
                lesson_id: { type: "string", format: "uuid" },
                title: { type: "string" },
                order_index: { type: "integer" },
                completed: { type: "boolean" },
                progress_pct: { type: "number" },
              },
            },
          },
        },
      },

      /* ── AI ── */
      GenerateQuizRequest: {
        type: "object",
        required: ["lesson_text"],
        properties: {
          lesson_text: {
            type: "string",
            description: "Non-empty lesson content to base questions on",
            example:
              "Node.js is a JavaScript runtime built on Chrome's V8 engine. It uses an event-driven, non-blocking I/O model that makes it lightweight and efficient.",
          },
          num_questions: {
            type: "integer",
            minimum: 1,
            maximum: 20,
            default: 5,
            description: "Number of quiz questions to generate (1-20)",
          },
        },
      },
      QuizQuestion: {
        type: "object",
        properties: {
          question: { type: "string", example: "What is Node.js built on?" },
          options: {
            type: "array",
            items: { type: "string" },
            example: [
              "A) Chrome's V8 engine",
              "B) Firefox SpiderMonkey",
              "C) Safari JavaScriptCore",
              "D) Microsoft Chakra",
            ],
          },
          answer: {
            type: "string",
            enum: ["A", "B", "C", "D"],
            example: "A",
          },
        },
      },

      /* ── Error ── */
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
      ValidationErrorResponse: {
        type: "object",
        properties: {
          errors: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
      MessageResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },

    /* ─────────── Reusable Responses ─────────── */
    responses: {
      Unauthorized: {
        description: "Missing or invalid access token",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { error: "Unauthorized" },
          },
        },
      },
      Forbidden: {
        description: "Insufficient role or ownership",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { error: "Forbidden" },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      RateLimited: {
        description: "Rate limit exceeded",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { error: "Too many requests. Please try again later." },
          },
        },
      },
    },
  },

  /* ═══════════════════════════════════════════════════════════════
     PATHS
     ═══════════════════════════════════════════════════════════════ */
  paths: {
    /* ─────────── AUTH ─────────── */
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        description:
          "Creates a new learner or instructor account. Admin role cannot self-register.",
        operationId: "register",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "User created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
                example: { message: "User created" },
              },
            },
          },
          400: {
            description: "Invalid role value",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Invalid role" },
              },
            },
          },
          403: {
            description: "Cannot self-register as admin",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Cannot self-register as admin" },
              },
            },
          },
        },
      },
    },

    "/api/auth/register/instructor": {
      post: {
        tags: ["Auth"],
        summary: "Register as instructor",
        description:
          "Creates a new user with the `instructor` role. No role field needed in the body.",
        operationId: "registerInstructor",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RegisterInstructorRequest",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Instructor account created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
                example: { message: "Instructor account created" },
              },
            },
          },
        },
      },
    },

    "/api/auth/register/admin": {
      post: {
        tags: ["Auth"],
        summary: "Register a new admin",
        description:
          "Creates a new user with the `admin` role. **Only existing admins** can access this endpoint.",
        operationId: "registerAdmin",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterAdminRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Admin account created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
                example: { message: "Admin account created" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },

    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        description:
          "Authenticates with email and password. Returns an access token and sets an HTTP-only `refresh_token` cookie.",
        operationId: "login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description:
              "Login successful — access token returned, refresh_token cookie set",
            headers: {
              "Set-Cookie": {
                description:
                  "HTTP-only cookie `refresh_token` for use at `/api/auth/refresh`",
                schema: { type: "string" },
              },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AccessTokenResponse" },
              },
            },
          },
          401: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Invalid credentials" },
              },
            },
          },
        },
      },
    },

    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        description:
          "Issues a new access token using the `refresh_token` cookie. The cookie must be sent with this request.",
        operationId: "refreshToken",
        security: [{ CookieAuth: [] }],
        responses: {
          200: {
            description: "New access token issued, new refresh cookie set",
            headers: {
              "Set-Cookie": {
                description: "Updated `refresh_token` cookie",
                schema: { type: "string" },
              },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AccessTokenResponse" },
              },
            },
          },
          401: {
            description: "No refresh cookie provided",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Invalid, expired, or revoked refresh token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },

    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        description:
          "Revokes the current refresh session and clears the `refresh_token` cookie.",
        operationId: "logout",
        responses: {
          204: {
            description:
              "Logged out successfully — cookie cleared if present",
          },
        },
      },
    },

    /* ─────────── COURSES ─────────── */
    "/api/v1/courses": {
      get: {
        tags: ["Courses"],
        summary: "List courses",
        description:
          "Returns a paginated list of courses with optional filters. Soft-deleted courses are excluded by default.",
        operationId: "listCourses",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1, minimum: 1 },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10, minimum: 1, maximum: 100 },
            description: "Items per page (max 100)",
          },
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Filter by title (partial match)",
          },
          {
            name: "is_free",
            in: "query",
            schema: { type: "string", enum: ["true", "false"] },
            description: "Filter by free/paid",
          },
          {
            name: "is_published",
            in: "query",
            schema: { type: "string", enum: ["true", "false"] },
            description: "Filter by publish status",
          },
          {
            name: "instructor_id",
            in: "query",
            schema: { type: "string", format: "uuid" },
            description: "Filter by instructor UUID",
          },
          {
            name: "sort_by",
            in: "query",
            schema: {
              type: "string",
              enum: ["created_at", "title", "price", "updated_at"],
              default: "created_at",
            },
            description: "Sort field",
          },
          {
            name: "sort_order",
            in: "query",
            schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
            description: "Sort direction",
          },
          {
            name: "include_deleted",
            in: "query",
            schema: { type: "string", enum: ["true", "false"], default: "false" },
            description: "Include soft-deleted courses",
          },
        ],
        responses: {
          200: {
            description: "Paginated list of courses",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    courses: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Course" },
                    },
                    pagination: {
                      $ref: "#/components/schemas/Pagination",
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Courses"],
        summary: "Create a course",
        description:
          "Creates a new course. The instructor ID is taken from the JWT `sub` claim.",
        operationId: "createCourse",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateCourseRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Course created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Course created" },
                    course: { $ref: "#/components/schemas/Course" },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation errors",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ValidationErrorResponse",
                },
                example: { errors: ["Title is required"] },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },

    "/api/v1/courses/my-courses": {
      get: {
        tags: ["Courses"],
        summary: "Get my courses (instructor/admin)",
        description:
          "Returns courses owned by the authenticated instructor or admin.",
        operationId: "getMyCourses",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1, minimum: 1 },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10, minimum: 1, maximum: 100 },
            description: "Items per page (max 100)",
          },
          {
            name: "is_published",
            in: "query",
            schema: { type: "string", enum: ["true", "false"] },
            description: "Filter by publish status",
          },
          {
            name: "include_deleted",
            in: "query",
            schema: { type: "string", enum: ["true", "false"], default: "false" },
            description: "Include soft-deleted courses",
          },
        ],
        responses: {
          200: {
            description: "Paginated list of instructor's courses",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    courses: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Course" },
                    },
                    pagination: {
                      $ref: "#/components/schemas/Pagination",
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },

    "/api/v1/courses/{id}": {
      get: {
        tags: ["Courses"],
        summary: "Get course by ID",
        description:
          "Returns a single course with instructor details, sections, enrollment count, and (if authenticated) enrollment status.",
        operationId: "getCourseById",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Course UUID",
          },
        ],
        responses: {
          200: {
            description: "Course details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    course: { $ref: "#/components/schemas/CourseDetail" },
                  },
                },
              },
            },
          },
          404: {
            description: "Course not found or soft-deleted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Course not found" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Courses"],
        summary: "Update a course",
        description:
          "Updates a course. Caller must be the course owner or an admin.",
        operationId: "updateCourse",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Course UUID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateCourseRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Course updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Course updated" },
                    course: { $ref: "#/components/schemas/Course" },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation errors",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ValidationErrorResponse",
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: {
            description: "Course not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Course not found" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Courses"],
        summary: "Delete a course",
        description:
          "Deletes a course. If published with enrollments it is soft-deleted; otherwise it is permanently removed.",
        operationId: "deleteCourse",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Course UUID",
          },
        ],
        responses: {
          200: {
            description: "Course deleted (soft or hard)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Course soft deleted (has enrollments)",
                    },
                    soft_deleted: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: {
            description: "Course not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Course not found" },
              },
            },
          },
        },
      },
    },

    /* ─────────── LESSONS ─────────── */
    "/api/v1/courses/{courseId}/lessons": {
      get: {
        tags: ["Lessons"],
        summary: "List lessons for a course",
        description:
          "Returns all lessons for a course, ordered by `order_index`. Each lesson includes `embed_url` when `youtube_video_id` is set.",
        operationId: "listLessons",
        parameters: [
          {
            name: "courseId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Course UUID",
          },
        ],
        responses: {
          200: {
            description: "List of lessons",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    lessons: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Lesson" },
                    },
                  },
                },
              },
            },
          },
          404: {
            description: "Course not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Course not found" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Lessons"],
        summary: "Create a lesson",
        description:
          "Adds a lesson to a course. Caller must own the course or be an admin.",
        operationId: "createLesson",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "courseId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Course UUID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateLessonRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Lesson created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Lesson created" },
                    lesson: { $ref: "#/components/schemas/Lesson" },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation errors",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ValidationErrorResponse",
                },
                example: { errors: ["Invalid YouTube URL"] },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: {
            description: "Course not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Course not found" },
              },
            },
          },
        },
      },
    },

    "/api/v1/courses/{courseId}/lessons/reorder": {
      put: {
        tags: ["Lessons"],
        summary: "Reorder lessons",
        description:
          "Sets the order of lessons by providing an ordered array of lesson IDs. Must include all lessons in the course.",
        operationId: "reorderLessons",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "courseId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Course UUID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ReorderLessonsRequest",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Lessons reordered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Lessons reordered",
                    },
                    lessons: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Lesson" },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid or incomplete lesson IDs",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                    invalid_ids: {
                      type: "array",
                      items: { type: "string", format: "uuid" },
                    },
                  },
                },
                examples: {
                  empty_array: {
                    summary: "Empty or missing array",
                    value: {
                      error: "lesson_ids must be a non-empty array",
                    },
                  },
                  invalid_ids: {
                    summary: "Some IDs not found",
                    value: {
                      error: "Invalid lesson IDs provided",
                      invalid_ids: [
                        "550e8400-e29b-41d4-a716-446655440099",
                      ],
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: {
            description: "Course not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Course not found" },
              },
            },
          },
        },
      },
    },

    "/api/v1/courses/{courseId}/lessons/{lessonId}": {
      get: {
        tags: ["Lessons"],
        summary: "Get lesson by ID",
        description: "Returns a single lesson with `embed_url`.",
        operationId: "getLessonById",
        parameters: [
          {
            name: "courseId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Course UUID",
          },
          {
            name: "lessonId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Lesson UUID",
          },
        ],
        responses: {
          200: {
            description: "Lesson details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    lesson: { $ref: "#/components/schemas/Lesson" },
                  },
                },
              },
            },
          },
          404: {
            description: "Course or lesson not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  course_not_found: {
                    summary: "Course not found",
                    value: { error: "Course not found" },
                  },
                  lesson_not_found: {
                    summary: "Lesson not found",
                    value: { error: "Lesson not found" },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ["Lessons"],
        summary: "Update a lesson",
        description:
          "Updates a lesson. Caller must own the parent course or be an admin.",
        operationId: "updateLesson",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "courseId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Course UUID",
          },
          {
            name: "lessonId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Lesson UUID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateLessonRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Lesson updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Lesson updated" },
                    lesson: { $ref: "#/components/schemas/Lesson" },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation errors",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ValidationErrorResponse",
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: {
            description: "Course or lesson not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Lessons"],
        summary: "Delete a lesson",
        description:
          "Deletes a lesson and its progress records; reorders remaining lessons.",
        operationId: "deleteLesson",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "courseId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Course UUID",
          },
          {
            name: "lessonId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Lesson UUID",
          },
        ],
        responses: {
          200: {
            description: "Lesson deleted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
                example: { message: "Lesson deleted" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: {
            description: "Course or lesson not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },

    /* ─────────── PROGRESS ─────────── */
    "/api/v1/lessons/{id}/complete": {
      post: {
        tags: ["Progress"],
        summary: "Mark lesson as complete",
        description:
          "Marks a lesson as complete for the authenticated user. User must be enrolled in the course with `active` status.",
        operationId: "markLessonComplete",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Lesson UUID",
          },
        ],
        responses: {
          200: {
            description: "Lesson marked as complete (or already completed)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Lesson marked as complete",
                    },
                    progress: { $ref: "#/components/schemas/Progress" },
                  },
                },
                examples: {
                  completed: {
                    summary: "Newly completed",
                    value: {
                      message: "Lesson marked as complete",
                      progress: {
                        user_id: "550e8400-e29b-41d4-a716-446655440010",
                        lesson_id: "550e8400-e29b-41d4-a716-446655440001",
                        course_id: "550e8400-e29b-41d4-a716-446655440000",
                        progress_pct: 100,
                        completed: true,
                        updated_at: "2025-01-15T10:30:00.000Z",
                      },
                    },
                  },
                  already_completed: {
                    summary: "Already completed",
                    value: {
                      message: "Lesson already completed",
                      progress: {
                        user_id: "550e8400-e29b-41d4-a716-446655440010",
                        lesson_id: "550e8400-e29b-41d4-a716-446655440001",
                        course_id: "550e8400-e29b-41d4-a716-446655440000",
                        progress_pct: 100,
                        completed: true,
                        updated_at: "2025-01-15T10:30:00.000Z",
                      },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: {
            description: "Not enrolled or enrollment not active",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error:
                    "You must be enrolled in this course to mark lessons complete",
                },
              },
            },
          },
          404: {
            description: "Lesson or course not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  lesson_not_found: {
                    summary: "Lesson not found",
                    value: { error: "Lesson not found" },
                  },
                  course_not_found: {
                    summary: "Course deleted",
                    value: {
                      error: "Course not found or has been deleted",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/progress/{courseId}": {
      get: {
        tags: ["Progress"],
        summary: "Get course progress",
        description:
          "Returns the authenticated user's progress in a course, including per-lesson completion. User must be enrolled.",
        operationId: "getCourseProgress",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "courseId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Course UUID",
          },
        ],
        responses: {
          200: {
            description: "Course progress data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CourseProgress" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: {
            description: "Not enrolled in the course",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error:
                    "You must be enrolled in this course to view progress",
                },
              },
            },
          },
          404: {
            description: "Course not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Course not found" },
              },
            },
          },
        },
      },
    },

    /* ─────────── AI ─────────── */
    "/api/v1/ai/quiz": {
      post: {
        tags: ["AI"],
        summary: "Generate AI quiz",
        description:
          "Generates multiple-choice quiz questions from lesson text using AI (Hugging Face). Results are cached by content + `num_questions`. Rate limited to **10 requests per 60 seconds** per user.",
        operationId: "generateQuiz",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GenerateQuizRequest" },
            },
          },
        },
        responses: {
          200: {
            description:
              "Quiz generated — may come from cache, Hugging Face, or fallback",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    source: {
                      type: "string",
                      enum: ["cache", "huggingface", "fallback"],
                      description: "Where the quiz came from",
                    },
                    quiz: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/QuizQuestion",
                      },
                    },
                    warning: {
                      type: "string",
                      description:
                        "Present when AI service was unavailable and a cache/fallback was used",
                    },
                    error: {
                      type: "string",
                      description:
                        "Technical error detail (present when warning exists)",
                    },
                  },
                },
                examples: {
                  success: {
                    summary: "Fresh AI-generated quiz",
                    value: {
                      source: "huggingface",
                      quiz: [
                        {
                          question: "What is Node.js built on?",
                          options: [
                            "A) Chrome's V8 engine",
                            "B) Firefox SpiderMonkey",
                            "C) Safari JavaScriptCore",
                            "D) Microsoft Chakra",
                          ],
                          answer: "A",
                        },
                      ],
                    },
                  },
                  cached: {
                    summary: "Served from cache (AI down)",
                    value: {
                      source: "cache",
                      quiz: [
                        {
                          question: "What is Node.js built on?",
                          options: [
                            "A) Chrome's V8 engine",
                            "B) Firefox SpiderMonkey",
                            "C) Safari JavaScriptCore",
                            "D) Microsoft Chakra",
                          ],
                          answer: "A",
                        },
                      ],
                      warning:
                        "AI service unavailable. Returned cached quiz.",
                      error: "EHOSTUNREACH",
                    },
                  },
                  fallback: {
                    summary: "Static fallback (AI down, no cache)",
                    value: {
                      source: "fallback",
                      quiz: [
                        {
                          question:
                            "Which of the following best describes the main topic of this lesson?",
                          options: [
                            "A) The core concepts presented in the lesson material",
                            "B) An unrelated scientific theory",
                            "C) A historical event from the 1800s",
                            "D) A mathematical proof",
                          ],
                          answer: "A",
                        },
                      ],
                      warning:
                        "AI service unavailable. Returned static fallback quiz.",
                      error: "EHOSTUNREACH",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing or empty lesson_text",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "lesson_text is required" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          429: { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
  },
};

export default swaggerDocument;
