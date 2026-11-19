const logger = require("../utils/logger");

function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message;

  if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path === "_id" ? "id" : err.path}`;
  } else if (err.name === "MulterError") {
    status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Screenshot is too large (max 5 MB each)"
        : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
          ? "Too many screenshots (max 5)"
          : err.message;
  } else if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)
      .map((fieldError) => fieldError.message)
      .join(", ");
  }

  const meta = {
    method: req.method,
    path: req.originalUrl,
    status,
    userId: req.user?.userId
  };

  if (status >= 500) {
    logger.error(err.message, { ...meta, stack: err.stack });
  } else {
    logger.warn(message, meta);
  }

  if (res.headersSent) {
    return next(err);
  }

  const isProduction = process.env.NODE_ENV === "production";

  res.status(status).json({
    message:
      status >= 500 && isProduction
        ? "Internal server error"
        : message
  });
}

module.exports = errorHandler;
