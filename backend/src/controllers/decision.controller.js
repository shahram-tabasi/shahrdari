/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import * as decisionService from "../services/decision.service.js";
import * as audit from "../services/audit.service.js";
import { AUDIT_CATEGORY } from "../services/audit.service.js";
import { successResponse } from "../utils/api-response.js";

/**
 * Decision-engine endpoints.
 *
 * Every engine run is audited. The directive requires the model version, the
 * data, the weights and the decision to be retained: a portfolio recommended
 * six months ago has to be
 * reproducible, which means the weights, the seed and the constraint overrides
 * that produced it must be on record, not just the result.
 */

export async function getScenarios(req, res, next) {
  try {
    const scenarios = await decisionService.getScenarios();

    res.status(200).json(
      successResponse({
        message: "سناریوهای ذخیره‌شده بازیابی شد.",
        data: scenarios
      })
    );
  } catch (error) {
    next(error);
  }
}

/**
 * EVALUATION — screening, data quality and life-cycle assessment.
 */
export async function evaluate(req, res, next) {
  try {
    const evaluation = await decisionService.evaluateProjects(req.body);

    audit.record({
      category: AUDIT_CATEGORY.DECISION,
      action: "decision.evaluate",
      requestId: req.id,
      actor: req.principal,
      detail: {
        projectCount: evaluation.projectCount,
        rejectedByScreening: evaluation.screening.rejectedCount,
        blockingDataFindings: evaluation.dataQuality.summary.blocking
      }
    });

    res.status(200).json(
      successResponse({
        message: "ارزیابی پروژه‌ها انجام شد.",
        data: evaluation
      })
    );
  } catch (error) {
    next(error);
  }
}

/**
 * FILTER 2 — ranking.
 */
export async function createRanking(req, res, next) {
  try {
    const ranking = await decisionService.rankProjects(req.body);

    audit.record({
      category: AUDIT_CATEGORY.DECISION,
      action: "decision.rank",
      requestId: req.id,
      actor: req.principal,
      detail: {
        weightSource: ranking.weighting.source,
        dimensionWeights: ranking.weighting.dimensionWeights,
        consistencyRatio: ranking.weighting.consistencyRatio,
        projectCount: ranking.projectCount,
        method: ranking.method.ranking
      }
    });

    res.status(200).json(
      successResponse({
        message: "پروژه‌ها رتبه‌بندی شدند.",
        data: ranking,
        meta: {
          note: "رتبه بالاتر الزاماً به معنای عضویت در سبد نهایی نیست."
        }
      })
    );
  } catch (error) {
    next(error);
  }
}

/**
 * FILTER 3 — portfolio construction.
 */
export async function optimizePortfolio(req, res, next) {
  try {
    const portfolio = await decisionService.optimizePortfolio(req.body);

    audit.record({
      category: AUDIT_CATEGORY.DECISION,
      action: "decision.portfolio",
      requestId: req.id,
      actor: req.principal,
      detail: {
        budget: portfolio.budget,
        status: portfolio.status,
        seed: portfolio.optimization.seed,
        weightSource: portfolio.weighting.source,
        dimensionWeights: portfolio.weighting.dimensionWeights,
        selectedProjects: portfolio.projects.map(project => project.id),
        feasible: portfolio.optimization.feasible,
        violations: portfolio.optimization.violations.map(v => v.rule)
      }
    });

    res.status(200).json(
      successResponse({
        message: portfolio.status === "proposed"
          ? "سبد پروژه تحت محدودیت‌های جاری تشکیل شد."
          : "با محدودیت‌های جاری هیچ سبد سازگاری وجود ندارد؛ نتیجه صرفاً تشخیصی است.",
        data: portfolio,
        meta: { status: portfolio.status }
      })
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Sensitivity and stability analysis.
 */
export async function analyzeSensitivity(req, res, next) {
  try {
    const analysis = await decisionService.analyzeSensitivity(req.body);

    audit.record({
      category: AUDIT_CATEGORY.DECISION,
      action: "decision.sensitivity",
      requestId: req.id,
      actor: req.principal,
      detail: {
        scenarios: analysis.sensitivity.scenarios,
        seed: analysis.sensitivity.seed,
        averageMembershipStability:
          analysis.sensitivity.summary.averageMembershipStability,
        maxRankReversal: analysis.sensitivity.summary.maxRankReversal
      }
    });

    res.status(200).json(
      successResponse({
        message: "تحلیل حساسیت و پایداری انجام شد.",
        data: analysis
      })
    );
  } catch (error) {
    next(error);
  }
}
