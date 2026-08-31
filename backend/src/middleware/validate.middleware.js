/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import { ZodError } from "zod";

import HttpError from "../utils/http-error.js";

/**
 * Validate a request against a Zod schema and replace the raw input with the
 * parsed result, so handlers only ever see values that passed validation.
 *
 * The parsed value replaces the original deliberately.
 * Validating and then continuing to read the raw input is a common way for an
 * unvalidated field to reach a handler; here it cannot, because the raw object
 * is gone by the time the handler runs.
 *
 * @param {import("zod").ZodSchema} schema
 * @param {"body"|"params"|"query"} [source]
 * @returns {import("express").RequestHandler}
 */
export default function validate(schema, source = "body") {
  return (req, res, next) => {
    let parsed;

    try {
      parsed = schema.parse(req[source]);
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new HttpError(
            400,
            "اعتبارسنجی ورودی ناموفق بود.",
            error.issues.map(issue => ({
              field: issue.path.join(".") || source,
              message: issue.message
            }))
          )
        );
      }

      return next(error);
    }

    if (source === "query") {
      // Express 5 exposes `req.query` through a getter with no setter, so a
      // plain assignment throws. Redefining the property is the supported way
      // to hand the handler the parsed value.
      Object.defineProperty(req, "query", {
        value: parsed,
        writable: true,
        enumerable: true,
        configurable: true
      });
    } else {
      req[source] = parsed;
    }

    return next();
  };
}
