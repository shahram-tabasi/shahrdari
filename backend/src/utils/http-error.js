/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

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