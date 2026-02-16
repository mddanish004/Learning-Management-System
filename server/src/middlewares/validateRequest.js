import { ValidationError } from '../errors/index.js';

const DEFAULT_OPTIONS = {
  abortEarly: false,
  convert: true,
  allowUnknown: false,
  stripUnknown: true,
};

function applyValidatedValue(req, target, value) {
  if (target === 'body') {
    req.body = value;
    return;
  }

  if (target === 'query' || target === 'params') {
    const current = req[target];

    if (current && typeof current === 'object') {
      for (const key of Object.keys(current)) {
        delete current[key];
      }

      Object.assign(current, value);
      return;
    }
  }

  req[target] = value;
}

export function validateRequest(schemas = {}) {
  return (req, res, next) => {
    const targets = ['params', 'query', 'body', 'headers'];
    const validationIssues = [];

    for (const target of targets) {
      const schema = schemas[target];

      if (!schema) {
        continue;
      }

      const options = target === 'headers'
        ? { ...DEFAULT_OPTIONS, allowUnknown: true, stripUnknown: false }
        : DEFAULT_OPTIONS;

      const { value, error } = schema.validate(req[target] ?? {}, options);

      if (error) {
        validationIssues.push(
          ...error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
          }))
        );
        continue;
      }

      applyValidatedValue(req, target, value);
    }

    if (validationIssues.length > 0) {
      throw new ValidationError('Request validation failed', validationIssues);
    }

    next();
  };
}
