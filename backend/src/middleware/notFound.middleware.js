import { errorResponse } from "../utils/api-response.js";

/**
 * Handle requests to undefined routes.
 */
export default function notFoundMiddleware(req, res) {
  res.status(404).json(
    errorResponse({
      message: "Resource not found.",
      errors: [
        {
          path: req.originalUrl,
          method: req.method
        }
      ]
    })
  );
}