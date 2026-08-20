import criteria from "../data/criteria.js";
import projects from "../data/projects.js";
import { savedScenarios } from "../data/system.js";

/**
 * Read the current project set used by the decision engine.
 *
 * @returns {Promise<Array>}
 */
export async function findProjects() {
  return structuredClone(projects);
}

/**
 * Read the current decision criteria.
 *
 * @returns {Promise<Array>}
 */
export async function findCriteria() {
  return structuredClone(criteria);
}

/**
 * Read the predefined portfolio scenarios.
 *
 * @returns {Promise<Array>}
 */
export async function findScenarios() {
  return structuredClone(savedScenarios);
}
