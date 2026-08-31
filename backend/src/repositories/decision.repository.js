import { criteria, dimensions, mandatoryCriteria } from "../data/criteria.js";
import neighborhoods from "../data/neighborhoods.js";
import policy from "../data/policy.js";
import projectClasses from "../data/project-classes.js";
import projects from "../data/projects.js";
import { savedScenarios } from "../data/system.js";

/**
 * Data access for the decision engine.
 *
 * Everything is handed out as a deep clone, so no engine can mutate the
 * shared dataset — a scenario run must never leave a residue that changes the
 * next run's result. This layer is the seam where the local demo data is later
 * replaced by the municipality's database.
 */

/**
 * @returns {Promise<Array>}
 */
export async function findProjects() {
  return structuredClone(projects);
}

/**
 * @returns {Promise<Array>}
 */
export async function findNeighborhoods() {
  return structuredClone(neighborhoods);
}

/**
 * The dimension-level criteria (the weighting control surface).
 *
 * @returns {Promise<Array>}
 */
export async function findDimensions() {
  return structuredClone(dimensions);
}

/**
 * The leaf preferential criteria.
 *
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
 * @returns {Promise<Array>}
 */
export async function findProjectClasses() {
  return structuredClone(projectClasses);
}

/**
 * @returns {Promise<Object>}
 */
export async function findPolicy() {
  return structuredClone(policy);
}

/**
 * @returns {Promise<Array>}
 */
export async function findScenarios() {
  return structuredClone(savedScenarios);
}
