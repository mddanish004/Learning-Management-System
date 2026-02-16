import {
  AppError,
  AuthError,
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
  ValidationError,
} from '../errors/index.js';
import { logRequestError } from '../utils/logger.js';

function resolveDefaultCode(statusCode) {
  if (statusCode === 400) return 'BAD_REQUEST';
  if (statusCode === 401) return 'UNAUTHORIZED';
  if (statusCode === 403) return 'FORBIDDEN';
  if (statusCode === 404) return 'NOT_FOUND';
  if (statusCode === 409) return 'CONFLICT';
  if (statusCode === 422) return 'VALIDATION_ERROR';
  if (statusCode === 429) return 'RATE_LIMIT_EXCEEDED';
  return 'INTERNAL_SERVER_ERROR';
}

function resolveDefaultMessage(statusCode) {
  if (statusCode === 400) return 'Bad request';
  if (statusCode === 401) return 'Authentication required';
  if (statusCode === 403) return 'Access denied';
  if (statusCode === 404) return 'Resource not found';
  if (statusCode === 409) return 'Conflict';
  if (statusCode === 422) return 'Validation failed';
  if (statusCode === 429) return 'Rate limit exceeded';
  return 'Internal server error';
}

function normalizeError(error) {
  if (error instanceof AppError) {
    return error;
  }

  if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
    return new AuthError('Invalid or expired token');
  }

  if (error?.type === 'entity.parse.failed') {
    return new ValidationError('Invalid JSON payload');
  }

  if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
    return new ConflictError('Resource already exists');
  }

  if (typeof error?.status === 'number' && error.status >= 400 && error.status < 500) {
    if (error.status === 401) return new AuthError(error.message || resolveDefaultMessage(401));
    if (error.status === 404) return new NotFoundError(error.message || resolveDefaultMessage(404));
    if (error.status === 409) return new ConflictError(error.message || resolveDefaultMessage(409));
    if (error.status === 400 || error.status === 422) {
      return new ValidationError(error.message || resolveDefaultMessage(error.status));
    }

    return new BadRequestError(error.message || resolveDefaultMessage(error.status));
  }

  return new InternalServerError('Internal server error');
}

function normalizeLegacyBody(body, statusCode, correlationId) {
  if (body && typeof body === 'object' && body.error && typeof body.error === 'object') {
    const payload = {
      error: {
        code: body.error.code || resolveDefaultCode(statusCode),
        message: body.error.message || resolveDefaultMessage(statusCode),
      },
      correlation_id: body.error.correlation_id || body.correlation_id || correlationId,
    };

    if (body.error.details !== undefined) {
      payload.error.details = body.error.details;
    }

    return payload;
  }

  const message = (() => {
    if (body && typeof body === 'object') {
      if (typeof body.error === 'string') return body.error;
      if (typeof body.message === 'string') return body.message;
      if (Array.isArray(body.errors) && body.errors.length > 0) {
        const first = body.errors[0];
        if (typeof first === 'string') return first;
        if (first && typeof first.message === 'string') return first.message;
      }
    }

    if (typeof body === 'string' && body.trim().length > 0) {
      return body;
    }

    return resolveDefaultMessage(statusCode);
  })();

  const details = (() => {
    if (body && typeof body === 'object') {
      if (Array.isArray(body.errors)) return body.errors;
      if (body.details !== undefined) return body.details;
      if (body.invalid_ids !== undefined) return { invalid_ids: body.invalid_ids };
      if (body.progress !== undefined) return { progress: body.progress };
    }

    return undefined;
  })();

  const payload = {
    error: {
      code: resolveDefaultCode(statusCode),
      message,
    },
    correlation_id: correlationId,
  };

  if (details !== undefined) {
    payload.error.details = details;
  }

  return payload;
}

export function normalizeLegacyErrorResponses(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (res.statusCode < 400 || res.locals.__error_response_normalized) {
      return originalJson(body);
    }

    const normalizedBody = normalizeLegacyBody(body, res.statusCode, req.correlationId);
    res.locals.__error_response_normalized = true;

    logRequestError({
      req,
      statusCode: res.statusCode,
      errorCode: normalizedBody.error.code,
      message: normalizedBody.error.message,
      details: normalizedBody.error.details,
    });

    return originalJson(normalizedBody);
  };

  next();
}

export function notFoundHandler(req, res, next) {
  next(new NotFoundError('Route not found'));
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const appError = normalizeError(error);

  const responseBody = {
    error: {
      code: appError.code,
      message: appError.message,
    },
    correlation_id: req.correlationId,
  };

  if (appError.details !== undefined) {
    responseBody.error.details = appError.details;
  }

  logRequestError({
    req,
    statusCode: appError.statusCode,
    errorCode: appError.code,
    message: appError.message,
    details: appError.details,
    error,
  });

  res.locals.__error_response_normalized = true;
  res.status(appError.statusCode).json(responseBody);
}
