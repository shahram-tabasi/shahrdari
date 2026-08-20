import * as dashboardService from "./dashboard.service.js";
import * as decisionService from "./decision.service.js";

/**
 * Build a unified AI context from all application modules.
 *
 * This service is the single source of truth for AI context.
 * Every AI feature must obtain its context from this service.
 * Future modules should be added here instead of directly
 * accessing repositories or services.
 *
 * @returns {Promise<Object>}
 */
export async function buildContext() {
  const [dashboard, ranking, scenarios] = await Promise.all([
    dashboardService.getDashboard(),
    decisionService.rankProjects(),
    decisionService.getScenarios()
  ]);

  return {
    generatedAt: new Date().toISOString(),

    application: {
      name: "Municipality Decision Support System",
      version: "1.0.0"
    },

    dashboard,

    decisionSupport: {
      ranking,
      scenarios
    },

    statistics: {
      totalProjects: dashboard.projects.length,
      totalCriteria: dashboard.criteria.length,
      totalNeighborhoods: dashboard.neighborhoods.length
    }
  };
}
