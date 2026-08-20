import criteria from "../data/criteria.js";

/**
 * Repository responsible for criteria data access.
 * The current implementation uses local demo data.
 * This layer can later be replaced with a database or external API.
 */

let criteriaCollection = structuredClone(criteria);

/**
 * Retrieve all criteria.
 *
 * @returns {Promise<Array>}
 */
export async function findAll() {
  return criteriaCollection;
}

/**
 * Retrieve a criterion by its identifier.
 *
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function findById(id) {
  return (
    criteriaCollection.find(
      criterion => String(criterion.id) === String(id)
    ) ?? null
  );
}

/**
 * Replace the entire criteria collection.
 *
 * @param {Array} collection
 * @returns {Promise<Array>}
 */
export async function replace(collection) {
  criteriaCollection = [...collection];

  return criteriaCollection;
}