import { ZodError } from "zod";

import HttpError from "../utils/http-error.js";

/**
 * Validate request data using a Zod schema.
 *
 * @param {import("zod").ZodSchema} schema
 * @param {"body"|"params"|"query"} source
 * @returns {import("express").RequestHandler}
 */
export default function validate(schema, source = "body") {
  return (req, res, next) => {
    try {
      req[source] = schema.parse(req[source]);

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new HttpError(
            400,
            "Validation failed.",
            error.issues.map(issue => ({
              field: issue.path.join("."),
              message: issue.message
            }))
          )
        );
      }

      next(error);
    }
  };
}