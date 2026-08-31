import {
  criteria,
  dimensions,
  mandatoryCriteria
} from "../data/criteria.js";

/**
 * Criteria data access.
 *
 * The leaf criteria and the mandatory gates are the شیوه‌نامه's own list and are
 * served read-only; only the dimension weights are mutable, because that is the
 * one thing the expert panel is entitled to change without amending the
 * شیوه‌نامه itself.
 */

let dimensionCollection = structuredClone(dimensions);

/**
 * @returns {Promise<Array>}
 */
export async function findDimensions() {
  return structuredClone(dimensionCollection);
}

/**
 * @returns {Promise<Array>}
 */
export async function findCriteria() {
  return structuredClone(criteria);
}

/**
 * @returns {Promise<Array>}
 */
export async function findMandatoryCriteria() {
  return structuredClone(mandatoryCriteria);
}

/**
 * Backward-compatible alias: the dashboard and the AI context builder ask for
 * "criteria" and mean the dimension-level list.
 *
 * @returns {Promise<Array>}
 */
export async function findAll() {
  return findDimensions();
}

/**
 * Look up a dimension by key, or a leaf criterion by code.
 *
 * @param {string} identifier
 * @returns {Promise<Object|null>}
 */
export async function findByIdentifier(identifier) {
  const key = String(identifier);

  const dimension = dimensionCollection.find(entry => entry.key === key);

  if (dimension) {
    return structuredClone({
      ...dimension,
      level: "dimension",
      criteria: criteria.filter(entry => entry.dimension === dimension.key)
    });
  }

  const criterion = criteria.find(
    entry => entry.code.toLowerCase() === key.toLowerCase()
  );

  if (criterion) {
    return structuredClone({ ...criterion, level: "criterion" });
  }

  const gate = mandatoryCriteria.find(
    entry => entry.code.toLowerCase() === key.toLowerCase()
  );

  return gate ? structuredClone({ ...gate, level: "mandatory" }) : null;
}

/**
 * Replace the dimension weights. Validation happens in the service; this layer
 * only stores.
 *
 * @param {Array} collection
 * @returns {Promise<Array>}
 */
export async function replaceDimensions(collection) {
  dimensionCollection = structuredClone(collection);

  return structuredClone(dimensionCollection);
}
