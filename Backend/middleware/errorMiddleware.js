import logger from '../utils/logger.js';

const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.errorCode || 'INTERNAL_ERROR';
  let errors = null;

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
    errorCode = 'RESOURCE_NOT_FOUND';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
    message = 'Validation failed';
  }

  if (err.code === 11000) {
    statusCode = 400;
    errorCode = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue).join(', ');
    message = `Duplicate value for: ${field}`;
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    errorCode = 'FILE_TOO_LARGE';
    message = 'File is too large. Maximum size is 5MB';
  }

  if (err.type === 'entity.too.large') {
    statusCode = 413;
    errorCode = 'PAYLOAD_TOO_LARGE';
    message = 'Request body is too large';
  }

  logger.error({ err, req: { id: req.id, method: req.method, url: req.originalUrl }, statusCode, errorCode },
    message);

  const response = {
    success: false,
    message,
    errorCode,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

export { notFound, errorHandler };
