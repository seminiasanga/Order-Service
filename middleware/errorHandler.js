// ─────────────────────────────────────────────────────────────────────────────
// src/middleware/errorHandler.js  —  CENTRALIZED ERROR HANDLING MIDDLEWARE
//
// What is middleware?
//   Middleware is a function that sits between the incoming request and the
//   final route handler.  Express runs middleware functions in the order they
//   are registered with app.use().
//
// What makes this an ERROR-handling middleware?
//   Express distinguishes error middleware by the number of parameters.
//   A regular middleware has (req, res, next) — 3 params.
//   An ERROR middleware has (err, req, res, next) — 4 params (first is the error).
//   When any route calls next(error), Express skips all regular middleware and
//   jumps straight to this function.
//
// Why centralize error handling?
//   Without this, every controller would need its own try/catch + res.json()
//   error response code.  With this, controllers just call next(err) and this
//   single function formats a consistent JSON error response every time.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Centralized error handling middleware.
 * Handles Mongoose errors, custom application errors, and generic errors.
 */
const errorHandler = (err, req, res, next) => {
  // Start with whatever status code was attached to the error object,
  // or default to 500 (Internal Server Error) if none was set.
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';

  // ── Mongoose ValidationError ───────────────────────────────────────────────
  // Thrown when a document fails schema validation (e.g. a required field is
  // missing, or an enum value is invalid).
  if (err.name === 'ValidationError') {
    statusCode = 400; // 400 = Bad Request
    // err.errors is an object keyed by field name; extract all messages
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // ── MongoDB Duplicate Key Error ────────────────────────────────────────────
  // Error code 11000 means we tried to insert a document with a value that
  // already exists in a field with a unique index (e.g. orderId).
  if (err.code === 11000) {
    statusCode = 409; // 409 = Conflict
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for ${field}`;
  }

  // ── Mongoose CastError ─────────────────────────────────────────────────────
  // Thrown when a value cannot be cast to the expected type.
  // Most common cause: passing an invalid MongoDB ObjectId string in a URL param.
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path}: "${err.value}"`;
  }

  // Log the error to the server console for debugging purposes
  // (In production you would send this to a logging service like Winston/DataDog)
  console.error(
    `[${new Date().toISOString()}] ${statusCode} ${req.method} ${req.originalUrl} — ${message}`
  );

  // Build the JSON response that is sent back to the API caller
  const response = { success: false, error: message };

  // In development mode, also include the full stack trace so developers can
  // pinpoint exactly where the error occurred.
  // NEVER expose stack traces in production — they reveal internal code paths.
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
