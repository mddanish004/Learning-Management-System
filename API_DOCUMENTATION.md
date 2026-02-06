# LMS API Documentation

This document describes all HTTP APIs exposed by the LMS (Learning Management System) server. Use it as a reference to build Swagger/OpenAPI specifications.

**Base URL:** `/api` (auth) and `/api/v1` (versioned resources)

**Content-Type:** `application/json`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Auth APIs](#auth-apis)
3. [Course APIs](#course-apis)
4. [Lesson APIs](#lesson-apis)
5. [Progress APIs](#progress-apis)
6. [AI APIs](#ai-apis)
7. [Common Patterns](#common-patterns)

---

## Authentication

- **Access token:** Obtained via `POST /api/auth/login` or `POST /api/auth/refresh`. Send in the `Authorization` header as `Bearer <accessToken>`.
- **Refresh token:** Stored in an HTTP-only cookie named `refresh_token`, sent only to `POST /api/auth/refresh` (path-specific).
- **JWT payload:** Access token contains `sub` (user ID) and `role` (`learner` | `instructor` | `admin`).

---

## Auth APIs

Base path: **`/api/auth`**

---

### Register (Learner or Instructor by role)

**`POST /api/auth/register`**

Creates a new user account. Role can be `learner` or `instructor`. Admin cannot self-register.

| Aspect | Details |
|--------|---------|
| **Auth** | Not required |
| **Request Body** | JSON |

**Request Body:**

| Field   | Type   | Required | Description |
|---------|--------|----------|-------------|
| name    | string | Yes      | User display name |
| email   | string | Yes      | Unique email |
| password| string | Yes      | Plain password (hashed server-side) |
| role    | string | No       | `learner` (default) or `instructor`. Must not be `admin`. |

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 201 | `{ "message": "User created" }` | Success |
| 400 | `{ "error": "Invalid role" }` | Invalid role value |
| 403 | `{ "error": "Cannot self-register as admin" }` | Role was `admin` |

---

### Register Instructor (public)

**`POST /api/auth/register/instructor`**

Creates a new user with role `instructor` (no role field in body).

| Aspect | Details |
|--------|---------|
| **Auth** | Not required |
| **Request Body** | JSON |

**Request Body:**

| Field    | Type   | Required | Description |
|----------|--------|----------|-------------|
| name     | string | Yes      | User display name |
| email    | string | Yes      | Unique email |
| password | string | Yes      | Plain password |

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 201 | `{ "message": "Instructor account created" }` | Success |

---

### Register Admin

**`POST /api/auth/register/admin`**

Creates a new user with role `admin`. Only existing admins can call this.

| Aspect | Details |
|--------|---------|
| **Auth** | Required (Bearer). **Roles:** `admin` |
| **Request Body** | JSON |

**Request Body:**

| Field    | Type   | Required | Description |
|----------|--------|----------|-------------|
| name     | string | Yes      | User display name |
| email    | string | Yes      | Unique email |
| password | string | Yes      | Plain password |

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 201 | `{ "message": "Admin account created" }` | Success |
| 401 | — | No/invalid token |
| 403 | — | Not admin |

---

### Login

**`POST /api/auth/login`**

Authenticates with email/password and returns an access token. Sets HTTP-only cookie `refresh_token` for use at `/api/auth/refresh`.

| Aspect | Details |
|--------|---------|
| **Auth** | Not required |
| **Request Body** | JSON |

**Request Body:**

| Field    | Type   | Required | Description |
|----------|--------|----------|-------------|
| email    | string | Yes      | User email |
| password | string | Yes      | Plain password |

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 200 | `{ "accessToken": "<jwt string>" }` | Success; `refresh_token` cookie set |
| 401 | `{ "error": "Invalid credentials" }` | Wrong email or password |

---

### Refresh Access Token

**`POST /api/auth/refresh`**

Issues a new access token using the `refresh_token` cookie. Cookie must be sent with this request (path: `/api/auth/refresh`).

| Aspect | Details |
|--------|---------|
| **Auth** | Cookie `refresh_token` (no Bearer) |
| **Request Body** | None |

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 200 | `{ "accessToken": "<jwt string>" }` | Success; new refresh cookie set |
| 401 | — | No refresh cookie |
| 403 | — | Invalid/expired/revoked refresh token |

---

### Logout

**`POST /api/auth/logout`**

Revokes the current refresh session and clears the `refresh_token` cookie.

| Aspect | Details |
|--------|---------|
| **Auth** | Optional (cookie); revokes if cookie present |
| **Request Body** | None |

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 204 | — | Success (cookie cleared if present) |

---

## Course APIs

Base path: **`/api/v1/courses`**

---

### List Courses

**`GET /api/v1/courses`**

Returns a paginated list of courses with optional filters. Excludes soft-deleted by default.

| Aspect | Details |
|--------|---------|
| **Auth** | Not required |
| **Query Parameters** | Optional |

**Query Parameters:**

| Parameter        | Type   | Default    | Description |
|------------------|--------|------------|-------------|
| page             | number | 1          | Page number |
| limit            | number | 10         | Items per page (max 100) |
| search           | string | —          | Filter by title (partial match) |
| is_free          | string | —          | `"true"` or `"false"` |
| is_published     | string | —          | `"true"` or `"false"` |
| instructor_id    | string | —          | Filter by instructor UUID |
| sort_by          | string | `created_at` | `created_at`, `title`, `price`, `updated_at` |
| sort_order       | string | `desc`     | `asc` or `desc` |
| include_deleted  | string | `false`    | `"true"` to include soft-deleted |

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 200 | See below | Success |

**Response Body (200):**

```json
{
  "courses": [
    {
      "id": "uuid",
      "instructor_id": "uuid",
      "title": "string",
      "description": "string | null",
      "price": "string",
      "is_free": true,
      "is_published": false,
      "created_at": "ISO date",
      "updated_at": "ISO date",
      "deleted_at": "ISO date | null",
      "instructor": {
        "id": "uuid",
        "name": "string",
        "email": "string"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### Get Course by ID

**`GET /api/v1/courses/:id`**

Returns a single course by ID with instructor, sections/content, enrollment count, and (if user is authenticated) enrollment status.

| Aspect | Details |
|--------|---------|
| **Auth** | Optional (if present, returns `user_enrollment_status`, `is_enrolled`) |
| **Path Parameters** | `id` — course UUID |

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 200 | See below | Success |
| 404 | `{ "error": "Course not found" }` | Course missing or soft-deleted |

**Response Body (200):**

```json
{
  "course": {
    "id": "uuid",
    "instructor_id": "uuid",
    "title": "string",
    "description": "string | null",
    "price": "string",
    "is_free": true,
    "is_published": false,
    "created_at": "ISO date",
    "updated_at": "ISO date",
    "deleted_at": "ISO date | null",
    "instructor": { "id": "uuid", "name": "string", "email": "string" },
    "sections": [
      {
        "id": "uuid",
        "course_id": "uuid",
        "title": "string",
        "order_no": 0,
        "content": []
      }
    ],
    "enrollment_count": 0,
    "user_enrollment_status": "active | null",
    "is_enrolled": false
  }
}
```

---

### Get My Courses (Instructor/Admin)

**`GET /api/v1/courses/my-courses`**

Returns courses owned by the authenticated instructor or admin.

| Aspect | Details |
|--------|---------|
| **Auth** | Required (Bearer). **Roles:** `instructor`, `admin` |
| **Query Parameters** | Optional |

**Query Parameters:**

| Parameter       | Type   | Default    | Description |
|-----------------|--------|------------|-------------|
| page            | number | 1          | Page number |
| limit           | number | 10         | Items per page (max 100) |
| is_published    | string | —          | `"true"` or `"false"` |
| include_deleted | string | `false`    | `"true"` to include soft-deleted |

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 200 | Same structure as **List Courses** (courses + pagination) | Success |
| 401 | — | No/invalid token |
| 403 | — | Not instructor/admin |

---

### Create Course

**`POST /api/v1/courses`**

Creates a new course. Instructor ID is taken from the JWT (`sub`).

| Aspect | Details |
|--------|---------|
| **Auth** | Required (Bearer). **Roles:** `instructor`, `admin` |
| **Request Body** | JSON |

**Request Body:**

| Field         | Type    | Required | Description |
|---------------|---------|----------|-------------|
| title         | string  | Yes      | 3–200 characters |
| description   | string  | No       | Max 5000 characters |
| price         | number  | No       | 0–999999.99; ignored if `is_free` true |
| is_free       | boolean | No       | Default inferred from price if omitted |
| is_published  | boolean | No       | Default `false` |

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 201 | `{ "message": "Course created", "course": { ... } }` | Success; `course` is full course object |
| 400 | `{ "errors": ["Title is required", ...] }` | Validation errors |
| 401 | — | No/invalid token |
| 403 | — | Not instructor/admin |

---

### Update Course

**`PUT /api/v1/courses/:id`**

Updates a course. Caller must be the course owner (or admin).

| Aspect | Details |
|--------|---------|
| **Auth** | Required (Bearer). **Roles:** `instructor`, `admin`; ownership validated |
| **Path Parameters** | `id` — course UUID |
| **Request Body** | JSON (all fields optional) |

**Request Body:**

| Field         | Type    | Description |
|---------------|---------|-------------|
| title         | string  | 3–200 characters |
| description   | string  | Max 5000 |
| price         | number  | 0–999999.99 |
| is_free       | boolean | If true, price set to 0 |
| is_published  | boolean | Publish/unpublish |

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 200 | `{ "message": "Course updated", "course": { ... } }` | Success |
| 400 | `{ "errors": ["..."] }` | Validation errors |
| 401 | — | No/invalid token |
| 403 | — | Not owner/admin |
| 404 | `{ "error": "Course not found" }` | Course missing or soft-deleted |

---

### Delete Course

**`DELETE /api/v1/courses/:id`**

Deletes a course. If published and has enrollments, soft-deletes; otherwise hard-deletes.

| Aspect | Details |
|--------|---------|
| **Auth** | Required (Bearer). **Roles:** `instructor`, `admin`; ownership validated |
| **Path Parameters** | `id` — course UUID |

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 200 | `{ "message": "Course soft deleted (has enrollments)", "soft_deleted": true }` | Soft delete |
| 200 | `{ "message": "Course permanently deleted", "soft_deleted": false }` | Hard delete |
| 401 | — | No/invalid token |
| 403 | — | Not owner/admin |
| 404 | `{ "error": "Course not found" }` | Course missing or soft-deleted |

---

## Lesson APIs

Base path: **`/api/v1/courses/:courseId/lessons`**

All lesson routes are nested under a course. `courseId` is the course UUID.

---

### List Lessons

**`GET /api/v1/courses/:courseId/lessons`**

Returns all lessons for a course, ordered by `order_index`. Each lesson includes `embed_url` (YouTube embed) when `youtube_video_id` is set.

| Aspect | Details |
|--------|---------|
| **Auth** | Not required |
| **Path Parameters** | `courseId` — course UUID |

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 200 | `{ "lessons": [ { ...lesson, "embed_url": "https://www.youtube.com/embed/..." } ] }` | Success |
| 404 | `{ "error": "Course not found" }` | Course missing or soft-deleted |

**Lesson object (in list):** `id`, `course_id`, `title`, `youtube_video_id`, `order_index`, `content_text`, `created_at`, `updated_at`, `embed_url`.

---

### Get Lesson by ID

**`GET /api/v1/courses/:courseId/lessons/:lessonId`**

Returns a single lesson with `embed_url`.

| Aspect | Details |
|--------|---------|
| **Auth** | Not required |
| **Path Parameters** | `courseId`, `lessonId` — UUIDs |

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 200 | `{ "lesson": { ...lesson, "embed_url": "..." } }` | Success |
| 404 | `{ "error": "Course not found" }` or `{ "error": "Lesson not found" }` | Not found |

---

### Create Lesson

**`POST /api/v1/courses/:courseId/lessons`**

Adds a lesson to a course. Caller must own the course (or be admin).

| Aspect | Details |
|--------|---------|
| **Auth** | Required (Bearer). **Roles:** `instructor`, `admin`; course ownership validated |
| **Path Parameters** | `courseId` — course UUID |
| **Request Body** | JSON |

**Request Body:**

| Field        | Type   | Required | Description |
|--------------|--------|----------|-------------|
| title        | string | Yes      | 3–200 characters |
| youtube_url  | string | No       | Valid YouTube URL (watch or youtu.be); extracted to `youtube_video_id` |
| content_text | string | No       | Max 50000 characters |
| order_index  | number | No       | Non-negative integer; default = append at end |

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 201 | `{ "message": "Lesson created", "lesson": { ... } }` | Success |
| 400 | `{ "errors": ["..."] }` | Validation (e.g. invalid YouTube URL) |
| 401 | — | No/invalid token |
| 403 | — | Not owner/admin |
| 404 | `{ "error": "Course not found" }` | Course missing or soft-deleted |

---

### Update Lesson

**`PUT /api/v1/courses/:courseId/lessons/:lessonId`**

Updates a lesson. Caller must own the course.

| Aspect | Details |
|--------|---------|
| **Auth** | Required (Bearer). **Roles:** `instructor`, `admin`; course ownership validated |
| **Path Parameters** | `courseId`, `lessonId` — UUIDs |
| **Request Body** | JSON (all optional) |

**Request Body:** Same as create: `title`, `youtube_url`, `content_text`, `order_index`.

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 200 | `{ "message": "Lesson updated", "lesson": { ... } }` | Success |
| 400 | `{ "errors": ["..."] }` | Validation |
| 401 | — | No/invalid token |
| 403 | — | Not owner/admin |
| 404 | `{ "error": "Course not found" }` or `{ "error": "Lesson not found" }` | Not found |

---

### Delete Lesson

**`DELETE /api/v1/courses/:courseId/lessons/:lessonId`**

Deletes a lesson and its progress records; reorders remaining lessons.

| Aspect | Details |
|--------|---------|
| **Auth** | Required (Bearer). **Roles:** `instructor`, `admin`; course ownership validated |
| **Path Parameters** | `courseId`, `lessonId` — UUIDs |

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 200 | `{ "message": "Lesson deleted" }` | Success |
| 401 | — | No/invalid token |
| 403 | — | Not owner/admin |
| 404 | `{ "error": "Course not found" }` or `{ "error": "Lesson not found" }` | Not found |

---

### Reorder Lessons

**`PUT /api/v1/courses/:courseId/lessons/reorder`**

Sets the order of lessons by providing an ordered array of lesson IDs.

| Aspect | Details |
|--------|---------|
| **Auth** | Required (Bearer). **Roles:** `instructor`, `admin`; course ownership validated |
| **Path Parameters** | `courseId` — course UUID |
| **Request Body** | JSON |

**Request Body:**

| Field       | Type     | Required | Description |
|-------------|----------|----------|-------------|
| lesson_ids  | string[] | Yes      | Ordered array of lesson UUIDs; must match all lessons in course |

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 200 | `{ "message": "Lessons reordered", "lessons": [ ... ] }` | Success; `lessons` is full list in new order |
| 400 | `{ "error": "lesson_ids must be a non-empty array" }` | Missing or empty array |
| 400 | `{ "error": "Invalid lesson IDs provided", "invalid_ids": ["uuid", ...] }` | IDs not in course |
| 401 | — | No/invalid token |
| 403 | — | Not owner/admin |
| 404 | `{ "error": "Course not found" }` | Course missing or soft-deleted |

---

## Progress APIs

Base path: **`/api/v1`**

---

### Mark Lesson Complete

**`POST /api/v1/lessons/:id/complete`**

Marks a lesson as complete for the authenticated user. User must be enrolled in the course with status `active`.

| Aspect | Details |
|--------|---------|
| **Auth** | Required (Bearer) |
| **Path Parameters** | `id` — lesson UUID |

**Request Body:** None.

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 200 | `{ "message": "Lesson marked as complete", "progress": { ... } }` or `{ "message": "Lesson already completed", "progress": { ... } }` | Success |
| 401 | — | No/invalid token |
| 403 | `{ "error": "You must be enrolled in this course to mark lessons complete" }` | Not enrolled or not active |
| 404 | `{ "error": "Lesson not found" }` or `{ "error": "Course not found or has been deleted" }` | Not found |

**Progress object:** `user_id`, `lesson_id`, `course_id`, `progress_pct`, `completed`, `updated_at`.

---

### Get Course Progress

**`GET /api/v1/progress/:courseId`**

Returns progress for the authenticated user in a course. User must be enrolled.

| Aspect | Details |
|--------|---------|
| **Auth** | Required (Bearer) |
| **Path Parameters** | `courseId` — course UUID |

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 200 | See below | Success |
| 401 | — | No/invalid token |
| 403 | `{ "error": "You must be enrolled in this course to view progress" }` | Not enrolled |
| 404 | `{ "error": "Course not found" }` | Course missing or soft-deleted |

**Response Body (200):**

```json
{
  "course_id": "uuid",
  "total_lessons": 10,
  "completed_lessons": 3,
  "completion_percentage": 30,
  "enrollment_status": "active",
  "lessons_progress": [
    {
      "lesson_id": "uuid",
      "title": "string",
      "order_index": 0,
      "completed": true,
      "progress_pct": 100
    }
  ]
}
```

---

## AI APIs

Base path: **`/api/v1/ai`**

---

### Generate Quiz

**`POST /api/v1/ai/quiz`**

Generates multiple-choice quiz questions from lesson text using AI (Hugging Face). Results are cached by content + num_questions. Rate limited per user (e.g. 10 requests per 60 seconds).

| Aspect | Details |
|--------|---------|
| **Auth** | Required (Bearer) |
| **Rate limit** | Per-user (e.g. 10 req/min) |
| **Request Body** | JSON |

**Request Body:**

| Field          | Type   | Required | Description |
|----------------|--------|----------|-------------|
| lesson_text    | string | Yes      | Non-empty lesson content to base questions on |
| num_questions  | number | No       | 1–20; default 5 |

**Responses:**

| Code | Body | Description |
|------|------|-------------|
| 200 | See below | Success (from cache, Hugging Face, or fallback) |

**Response Body (200) — normal:**

```json
{
  "source": "cache | huggingface | fallback",
  "quiz": [
    {
      "question": "string",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "answer": "A | B | C | D"
    }
  ]
}
```

**When AI fails but cache exists:**

```json
{
  "source": "cache",
  "quiz": [ ... ],
  "warning": "AI service unavailable. Returned cached quiz.",
  "error": "string"
}
```

**When AI fails and no cache (fallback):**

```json
{
  "source": "fallback",
  "quiz": [ ... ],
  "warning": "AI service unavailable. Returned static fallback quiz.",
  "error": "string"
}
```

**Error responses:**

| Code | Body | Description |
|------|------|-------------|
| 400 | `{ "error": "lesson_text is required" }` | Missing or empty `lesson_text` |
| 401 | — | No/invalid token |
| 403 | — | Invalid token |
| 429 | — | Rate limit exceeded (if middleware returns 429) |

---

## Common Patterns

### Pagination

List endpoints return:

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Errors

- **400:** Validation — often `{ "errors": ["..."] }` or `{ "error": "..." }`.
- **401:** Missing or invalid `Authorization` header / token.
- **403:** Valid token but insufficient role or ownership (or invalid/revoked refresh token for auth routes).
- **404:** `{ "error": "Resource not found" }` (exact message varies: "Course not found", "Lesson not found", etc.).
- **429:** Rate limit exceeded (e.g. AI quiz).

### Sending the access token

```
Authorization: Bearer <accessToken>
```

### User roles

- **learner** — Can register, login, view courses/lessons, mark progress, use AI quiz (when enrolled/authenticated).
- **instructor** — Same as learner plus: create/edit/delete own courses and lessons, reorder lessons, list my-courses.
- **admin** — Same as instructor plus: register admin, manage any course (ownership not required).

---

*End of API documentation. Use this file to generate Swagger/OpenAPI YAML or JSON.*
