import { errorResponse } from "../utils/api-response.js";

/**
 * Global application error handler.
 */
export default function errorMiddleware(err, req, res, next) {
  console.error(err);

  const statusCode = err.statusCode || 500;

  const response = errorResponse({
    message: err.message || "Internal server error.",
    errors:
      process.env.NODE_ENV === "development"
        ? err.errors || [
            {
              name: err.name,
              stack: err.stack
            }
          ]
        : err.errors || null
  });

  res.status(statusCode).json(response);
}