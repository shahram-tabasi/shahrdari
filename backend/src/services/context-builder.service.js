/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import env from "../config/env.js";
import { product } from "../config/branding.js";
import { anonymizeContext } from "../security/guardrails.js";
import * as decisionService from "./decision.service.js";
import * as dashboardService from "./dashboard.service.js";

/**
 * Build the context handed to the language model.
 *
 * LEAST PRIVILEGE FOR AI AGENTS. The model gets the
 * minimum needed for the task it was asked to do, not the whole application
 * state. The previous implementation shipped the entire dashboard, ranking and
 * scenario set on every call, which is both a data-governance problem (a
 * third-party API receives everything) and a cost problem.
 *
 * DATA FLOW: this function is the single point where municipality data
 * can leave for a model. Everything it returns is anonymised first, and when
 * the deployment has not explicitly opted in to external processing, narrative
 * free-text fields are dropped entirely.
 */

/**
 * What each task is allowed to see.
 */
const TASK_SCOPES = {
  extractClauses: ["criteriaModel"],
  suggestCriteria: ["criteriaModel"],
  matchStrategy: ["criteriaModel", "projectSummaries"],
  summarizeProposal: ["projectSummaries"],
  detectConflicts: ["projectSummaries", "dataQuality"],
  extractEntities: [],
  explainResult: ["criteriaModel", "ranking"]
};

/**
 * Reduce a project to the fields a model needs to reason about it.
 *
 * @param {Object} project
 * @returns {Object}
 */
function summarizeProject(project) {
  return {
    id: project.id,
    name: project.name,
    district: project.district,
    category: project.category,
    status: project.status,
    projectClass: project.classification?.projectClass ?? null,
    missionDomain: project.classification?.missionDomain ?? null,
    budget: project.budget,
    progress: project.progress,
    beneficiaries: project.beneficiaries,
    scores: project.scores,
    // The narrative field is the one most likely to name a person or to carry
    // an instruction planted upstream, so it is included only when the
    // deployment has opted in to external processing.
    explain: env.ai.allowExternalDocuments ? project.explain : undefined
  };
}

/**
 * @param {Object} options
 * @param {string} options.task
 * @param {string[]} [options.projectIds]
 * @returns {Promise<Object>}
 */
export async function buildContext({ task, projectIds } = {}) {
  const scope = new Set(TASK_SCOPES[task] ?? []);

  const context = {
    generatedAt: new Date().toISOString(),
    application: {
      name: product.fullFa,
      basis: product.basisFa
    },
    scope: [...scope]
  };

  if (scope.has("criteriaModel")) {
    const evaluation = await decisionService.evaluateProjects({ projectIds });

    context.criteriaModel = {
      dimensions: evaluation.model.dimensions,
      criteriaCount: evaluation.model.criteriaCount,
      projectClasses: evaluation.model.projectClasses
    };
  }

  if (scope.has("projectSummaries")) {
    const dashboard = await dashboardService.getDashboard();
    const selected = projectIds
      ? dashboard.projects.filter(project =>
          projectIds.includes(String(project.id))
        )
      : dashboard.projects;

    context.projects = selected.map(summarizeProject);
  }

  if (scope.has("dataQuality")) {
    const evaluation = await decisionService.evaluateProjects({ projectIds });

    context.dataQuality = evaluation.dataQuality;
    context.screening = evaluation.screening;
  }

  if (scope.has("ranking")) {
    const ranking = await decisionService.rankProjects({ projectIds });

    context.ranking = {
      method: ranking.method,
      weighting: ranking.weighting,
      projects: ranking.projects.map(project => ({
        id: project.id,
        name: project.name,
        rank: project.rank,
        rankInClass: project.rankInClass,
        projectClass: project.projectClass,
        netFlow: project.netFlow,
        finalScore: project.finalScore
      })),
      explanations: ranking.explanations
    };
  }

  // Last line of defence before the data leaves this process.
  return anonymizeContext(context);
}
