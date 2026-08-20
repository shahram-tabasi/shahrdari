import * as criteriaRepository from "../repositories/criteria.repository.js";
import HttpError from "../utils/http-error.js";

/**
 * Retrieve all criteria.
 *
 * @returns {Promise<Array>}
 */
export async function getAllCriteria() {
  return criteriaRepository.findAll();
}

/**
 * Retrieve a criterion by its identifier.
 *
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getCriterionById(id) {
  const criterion = await criteriaRepository.findById(id);

  if (!criterion) {
    throw new HttpError(404, "Criterion not found.");
  }

  return criterion;
}

/**
 * Replace the entire criteria collection.
 *
 * @param {Array} collection
 * @returns {Promise<Array>}
 */
export async function replaceCriteria(collection) {
  if (!Array.isArray(collection)) {
    throw new HttpError(
      400,
      "Criteria collection must be an array."
    );
  }

  return criteriaRepository.replace(collection);
}