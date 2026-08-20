import * as decisionRepository from "../repositories/decision.repository.js";
import HttpError from "../utils/http-error.js";

const round = (value, precision = 2) =>
  Number(value.toFixed(precision));

function createWeights(criteria, overrides) {
  const weights = Object.fromEntries(
    criteria.map(criterion => [
      criterion.key,
      overrides?.[criterion.key] ?? criterion.weight
    ])
  );
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  if (total <= 0) {
    throw new HttpError(400, "The total criterion weight must be greater than zero.");
  }

  return { weights, total };
}

function assertProjectIds(projects, ids) {
  const availableIds = new Set(projects.map(project => String(project.id)));
  const missingIds = ids.filter(id => !availableIds.has(id));

  if (missingIds.length > 0) {
    throw new HttpError(404, "One or more projects were not found.", missingIds.map(id => ({
      field: "projectId",
      message: `Project ${id} was not found.`
    })));
  }
}

function rank(projects, criteria, overrides) {
  const { weights, total } = createWeights(criteria, overrides);
  const criterionKeys = criteria.map(criterion => criterion.key);

  const ranking = projects
    .map(project => {
      const weightedTotal = criterionKeys.reduce((sum, key) => {
        const score = project.scores?.[key];

        if (!Number.isFinite(score)) {
          throw new HttpError(
            500,
            `Project ${project.id} has no valid score for criterion ${key}.`
          );
        }

        return sum + score * weights[key];
      }, 0);

      return {
        ...project,
        finalScore: round(weightedTotal / total, 4)
      };
    })
    .sort((left, right) =>
      right.finalScore - left.finalScore ||
      String(left.id).localeCompare(String(right.id))
    )
    .map((project, index) => ({ ...project, rank: index + 1 }));

  return { ranking, weights };
}

/**
 * Rank projects using normalized weighted-sum scoring.
 *
 * @param {Object} input
 * @returns {Promise<Object>}
 */
export async function rankProjects(input = {}) {
  const [projects, criteria] = await Promise.all([
    decisionRepository.findProjects(),
    decisionRepository.findCriteria()
  ]);
  const projectIds = input.projectIds ?? projects.map(project => String(project.id));

  assertProjectIds(projects, projectIds);

  const requestedIds = new Set(projectIds);
  const selectedProjects = projects.filter(project => requestedIds.has(String(project.id)));
  const result = rank(selectedProjects, criteria, input.weights);

  return {
    weights: result.weights,
    projectCount: result.ranking.length,
    projects: result.ranking
  };
}

/**
 * Build a budget-constrained portfolio from the ranked project set.
 * Explicitly included projects are funded first in ranking order.
 *
 * @param {Object} input
 * @returns {Promise<Object>}
 */
export async function optimizePortfolio(input) {
  const [projects, criteria] = await Promise.all([
    decisionRepository.findProjects(),
    decisionRepository.findCriteria()
  ]);
  const includedIds = input.includeProjectIds ?? [];
  const excludedIds = input.excludeProjectIds ?? [];

  assertProjectIds(projects, [...includedIds, ...excludedIds]);

  const { ranking, weights } = rank(projects, criteria, input.weights);
  const included = new Set(includedIds);
  const excluded = new Set(excludedIds);
  const mandatoryProjects = ranking.filter(project => included.has(String(project.id)));
  const mandatoryBudget = mandatoryProjects.reduce((sum, project) => sum + project.budget, 0);

  if (mandatoryBudget > input.budget) {
    throw new HttpError(
      422,
      "Included projects exceed the available budget.",
      [{ field: "includeProjectIds", message: `Included projects require ${mandatoryBudget}.` }]
    );
  }

  const selected = [...mandatoryProjects];
  const selectedIds = new Set(includedIds);
  let usedBudget = mandatoryBudget;

  ranking.forEach(project => {
    const id = String(project.id);

    if (selectedIds.has(id) || excluded.has(id)) {
      return;
    }

    if (usedBudget + project.budget <= input.budget) {
      selected.push(project);
      selectedIds.add(id);
      usedBudget += project.budget;
    }
  });

  selected.sort((left, right) => left.rank - right.rank);

  const totalBudget = projects.reduce((sum, project) => sum + project.budget, 0);
  const average = field => selected.length === 0
    ? 0
    : selected.reduce((sum, project) => sum + project[field], 0) / selected.length;

  return {
    budget: input.budget,
    usedBudget,
    remainingBudget: round(input.budget - usedBudget),
    utilizationPercent: round((usedBudget / input.budget) * 100),
    portfolioCoveragePercent: round((usedBudget / totalBudget) * 100),
    projectCount: selected.length,
    averageScore: round(average("finalScore")),
    averageJustice: round(average("justice"), 4),
    averageRisk: round(average("risk")),
    weights,
    projects: selected
  };
}

/**
 * Retrieve predefined decision scenarios.
 *
 * @returns {Promise<Array>}
 */
export async function getScenarios() {
  return decisionRepository.findScenarios();
}
