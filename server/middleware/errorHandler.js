export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = error.status || 500;
  let message = error.message || 'An unexpected server error occurred.';

  if (error.name === 'ValidationError') {
    status = 400;
    message = Object.values(error.errors).map((item) => item.message).join(' ');
  } else if (error.code === 11000) {
    status = 409;
    message = 'A record with that unique value already exists.';
  } else if (error.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier or value.';
  }

  if (status >= 500) console.error(error);
  res.status(status).json({ message });
}
