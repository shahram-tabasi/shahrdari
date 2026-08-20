import neighborhoods from "../data/neighborhoods.js";

/**
 * Repository responsible for neighborhood data access.
 * The current implementation uses local demo data.
 * This layer can later be replaced with a database or external API.
 */

let neighborhoodCollection = structuredClone(neighborhoods);

/**
 * Retrieve all neighborhoods.
 *
 * @returns {Promise<Array>}
 */
export async function findAll() {
  return neighborhoodCollection;
}

/**
 * Retrieve a neighborhood by its identifier.
 *
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function findById(id) {
  return (
    neighborhoodCollection.find(
      neighborhood => String(neighborhood.id) === String(id)
    ) ?? null
  );
}

/**
 * Replace the entire neighborhood collection.
 *
 * @param {Array} collection
 * @returns {Promise<Array>}
 */
export async function replace(collection) {
  neighborhoodCollection = [...collection];

  return neighborhoodCollection;
}