function serializeError(error) {
  if (!error || typeof error !== 'object') {
    return null;
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code,
  };
}

function write(level, payload) {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    ...payload,
  };

  const line = JSON.stringify(record);

  if (level === 'error') {
    console.error(line);
    return;
  }

  console.log(line);
}

export function logError(payload) {
  write('error', payload);
}

export function logRequestError({ req, statusCode, errorCode, message, details, error }) {
  logError({
    event: 'request_error',
    correlation_id: req.correlationId,
    method: req.method,
    path: req.originalUrl,
    status_code: statusCode,
    error_code: errorCode,
    message,
    details,
    user_id: req.user?.sub ?? null,
    error: serializeError(error),
  });
}
