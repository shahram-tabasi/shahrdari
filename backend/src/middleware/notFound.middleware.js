/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

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