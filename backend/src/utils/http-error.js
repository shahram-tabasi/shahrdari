/**
 * Standard application HTTP error.
 */
export default class HttpError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {Array|null} errors
   */
  constructor(statusCode, message, errors = null) {
    super(message);

    this.name = "HttpError";
    this.statusCode = statusCode;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}