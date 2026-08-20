/**
 * Create a successful API response.
 *
 * @param {Object} options
 * @param {string} options.message
 * @param {*} options.data
 * @param {Object|null} options.meta
 * @returns {Object}
 */
export function successResponse({
  message = "Request completed successfully.",
  data = null,
  meta = null
} = {}) {
  return {
    success: true,
    message,
    data,
    errors: null,
    meta
  };
}

/**
 * Create an error API response.
 *
 * @param {Object} options
 * @param {string} options.message
 * @param {Array|null} options.errors
 * @returns {Object}
 */
export function errorResponse({
  message = "Request failed.",
  errors = null
} = {}) {
  return {
    success: false,
    message,
    data: null,
    errors,
    meta: null
  };
}