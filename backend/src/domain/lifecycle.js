/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * FORWARD-LOOKING EVALUATION of in-progress projects, plus multi-year
 * life-cycle cost.
 *
 * Appendix 2, note 1 names the sunk-cost fallacy explicitly: half-finished
 * projects must not receive preferential scoring merely because money has
 * already been spent on them; they must be assessed on FUTURE costs and
 * benefits.
 *
 * The consequence for this code is concrete and load-bearing: `progress` and
 * money already spent NEVER enter the continuation decision. What enters is the
 * incremental trade-off — the cost of finishing versus the cost of stopping —
 * because that is the only comparison still open to the decision maker.
 *
 * `sunkCostExcluded` is reported in the output purely so a reviewer can see
 * that the figure was identified and deliberately left out. Do not feed it back
 * into any calculation.
 */

import { planningHorizon } from "../data/policy.js";
import { round } from "./normalize.js";

/**
 * Recommendation for a half-finished project.
 */
export const CONTINUATION = Object.freeze({
  CONTINUE: "continue",
  PHASE: "phase",
  DEFER: "defer",
  TERMINATE: "terminate"
});

/**
 * Present value of an amount realised `months` from the base year.
 *
 * @param {number} amount
 * @param {number} months
 * @param {number} [annualRatePercent]
 * @returns {number}
 */
export function presentValue(
  amount,
  months,
  annualRatePercent = planningHorizon.discountRatePercent
) {
  if (!Number.isFinite(amount)) {
    return 0;
  }

  const years = Math.max(0, months) / 12;
  const rate = annualRatePercent / 100;

  return amount / (1 + rate) ** years;
}

/**
 * Escalate a nominal cost to the year it is actually incurred.
 *
 * Without this, a portfolio that looks affordable in the base year quietly
 * becomes unaffordable by year three — the exact failure the appendix warns
 * about when it lists «هزینه تعدیل و تورم» among the required inputs.
 *
 * @param {number} amount
 * @param {number} year
 * @param {Object} [horizon]
 * @returns {number}
 */
export function escalate(amount, year, horizon = planningHorizon) {
  const offset = Math.max(0, year - horizon.baseYear);
  const rate = horizon.escalationRatePercent / 100;

  return amount * (1 + rate) ** offset;
}

/**
 * Total life-cycle cost of a project over the planning horizon: the escalated
 * cash flow to build it, plus the discounted cost of operating it.
 *
 * @param {Object} project
 * @param {Object} [horizon]
 * @returns {Object}
 */
export function lifecycleCost(project, horizon = planningHorizon) {
  const cashFlow = project.finance?.cashFlow ?? {};

  const capital = horizon.years.reduce((sum, year) => {
    const amount = cashFlow[year] ?? cashFlow[String(year)] ?? 0;

    return sum + escalate(amount, year, horizon);
  }, 0);

  const annualOperating = project.lifecycle?.annualOperatingCost ?? 0;
  const operatingYears = horizon.years.length;

  const operating = Array.from({ length: operatingYears }, (unused, index) =>
    presentValue(annualOperating, (index + 1) * 12, horizon.discountRatePercent)
  ).reduce((sum, value) => sum + value, 0);

  return {
    capital: round(capital, 2),
    operating: round(operating, 2),
    total: round(capital + operating, 2),
    futureCommitments: round(project.finance?.futureCommitments ?? 0, 2)
  };
}

/**
 * Evaluate a half-finished project on future cost and benefit alone.
 *
 * @param {Object} project
 * @param {Object} [horizon]
 * @returns {Object}
 */
export function evaluateContinuation(project, horizon = planningHorizon) {
  const lifecycle = project.lifecycle ?? {};

  const costToComplete = lifecycle.costToComplete ?? 0;
  const monthsToComplete = lifecycle.monthsToComplete ?? 0;
  const monthsToBenefit = lifecycle.monthsToBenefit ?? monthsToComplete;

  // Forward benefit, discounted to the moment the decision is made and
  // haircut by the risk that work already done has to be redone.
  const grossBenefit = presentValue(
    lifecycle.realizableBenefits ?? 0,
    monthsToBenefit,
    horizon.discountRatePercent
  );
  const depreciationRisk = Math.min(1, Math.max(0, lifecycle.depreciationRisk ?? 0));
  const forwardBenefit = grossBenefit * (1 - depreciationRisk);

  // Forward cost of continuing.
  const forwardCost =
    presentValue(costToComplete, monthsToComplete / 2, horizon.discountRatePercent) +
    presentValue(
      (lifecycle.annualOperatingCost ?? 0) * horizon.years.length,
      monthsToBenefit,
      horizon.discountRatePercent
    );

  // Forward cost of stopping: penalties, damages and the outstanding
  // contractual commitments that do not disappear when work does.
  const terminationCost =
    (lifecycle.terminationCost ?? 0) +
    (lifecycle.potentialDamages ?? 0);

  const netContinuationValue = forwardBenefit - forwardCost;
  const netTerminationValue = -terminationCost;

  let recommendation;

  if (netContinuationValue >= netTerminationValue) {
    recommendation = lifecycle.phaseable && netContinuationValue < forwardCost * 0.15
      ? CONTINUATION.PHASE
      : CONTINUATION.CONTINUE;
  } else {
    recommendation = lifecycle.phaseable
      ? CONTINUATION.DEFER
      : CONTINUATION.TERMINATE;
  }

  return {
    projectId: String(project.id),
    /**
     * Restated for the report; NEVER used as an input. The appendix wants the
     * sunk figure visible so a reviewer can confirm it was excluded on purpose.
     */
    sunkCostExcluded: round(
      (project.budget ?? 0) - costToComplete,
      2
    ),
    forwardBenefit: round(forwardBenefit, 2),
    forwardCost: round(forwardCost, 2),
    terminationCost: round(terminationCost, 2),
    netContinuationValue: round(netContinuationValue, 2),
    netTerminationValue: round(netTerminationValue, 2),
    benefitCostRatio: forwardCost > 0 ? round(forwardBenefit / forwardCost, 3) : null,
    contractualCommitments: lifecycle.contractualCommitments ?? 0,
    phaseable: Boolean(lifecycle.phaseable),
    recommendation,
    rationale:
      recommendation === CONTINUATION.TERMINATE ||
      recommendation === CONTINUATION.DEFER
        ? "ارزش آتی ادامه پروژه کمتر از هزینه توقف آن است؛ تصمیم بر پایه هزینه و منفعت آینده و بدون احتساب هزینه‌های ازدست‌رفته گرفته شده است."
        : "ادامه پروژه بر پایه منافع قابل تحقق آتی نسبت به هزینه تکمیل توجیه دارد؛ هزینه‌های گذشته در این ارزیابی لحاظ نشده‌اند."
  };
}

/**
 * The minimum data the appendix requires before a half-finished project may be
 * evaluated at all. A missing field is reported, not defaulted.
 */
const REQUIRED_LIFECYCLE_FIELDS = [
  ["physicalProgressPercent", "درصد پیشرفت واقعی"],
  ["costToComplete", "هزینه تکمیل"],
  ["monthsToComplete", "زمان تکمیل"],
  ["contractualCommitments", "تعهدات قراردادی"],
  ["terminationCost", "هزینه توقف یا خاتمه"],
  ["potentialDamages", "خسارت احتمالی"],
  ["depreciationRisk", "ریسک استهلاک عملیات انجام‌شده"],
  ["monthsToBenefit", "زمان لازم برای بهره‌برداری"],
  ["realizableBenefits", "منافع قابل تحقق پس از تکمیل"],
  ["phaseable", "قابلیت تعلیق یا اجرای مرحله‌ای"]
];

/**
 * Report which of the required half-finished-project inputs are absent.
 *
 * @param {Object} project
 * @returns {Array<{ field: string, label: string }>}
 */
export function missingLifecycleData(project) {
  const lifecycle = project.lifecycle ?? {};

  return REQUIRED_LIFECYCLE_FIELDS.filter(([field]) => {
    const value = lifecycle[field];

    return value === undefined || value === null;
  }).map(([field, label]) => ({ field, label }));
}
