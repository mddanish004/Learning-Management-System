const DEFAULT_ERROR_CODE = 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  constructor(message, options = {}) {
    const { statusCode = 500, code = DEFAULT_ERROR_CODE, details } = options;
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details) {
    super(message, { statusCode: 400, code: 'VALIDATION_ERROR', details });
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details) {
    super(message, { statusCode: 400, code: 'BAD_REQUEST', details });
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required', details) {
    super(message, { statusCode: 401, code: 'UNAUTHORIZED', details });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', details) {
    super(message, { statusCode: 403, code: 'FORBIDDEN', details });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details) {
    super(message, { statusCode: 404, code: 'NOT_FOUND', details });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details) {
    super(message, { statusCode: 409, code: 'CONFLICT', details });
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Rate limit exceeded', details) {
    super(message, { statusCode: 429, code: 'RATE_LIMIT_EXCEEDED', details });
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', details) {
    super(message, { statusCode: 500, code: 'INTERNAL_SERVER_ERROR', details });
  }
}
