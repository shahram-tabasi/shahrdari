import system from "../data/system.js";

/**
 * Repository responsible for system configuration data.
 * The current implementation uses local demo data.
 * This layer can later be replaced with a database or external API.
 */

let systemConfiguration = structuredClone(system);

/**
 * Retrieve system configuration.
 *
 * @returns {Promise<Object>}
 */
export async function find() {
  return systemConfiguration;
}

/**
 * Replace system configuration.
 *
 * @param {Object} configuration
 * @returns {Promise<Object>}
 */
export async function update(configuration) {
  systemConfiguration = {
    ...systemConfiguration,
    ...configuration
  };

  return systemConfiguration;
}