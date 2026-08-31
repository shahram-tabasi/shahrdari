/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * DATA QUALITY CONTROL — detecting gaps, contradictions and invalid data.
 *
 * This module exists so that a decision is never defended with a number nobody
 * entered.
 *
 * IT REPORTS; IT DOES NOT REPAIR. Silently defaulting a missing cost or
 * inventing a missing score is precisely the behaviour the directive forbids
 * the language model from doing ("do not guess missing information"), and the
 * same rule applies to our own code. If you are tempted to add a fallback
 * value here, add a finding instead.
 *
 * Three kinds of finding are produced:
 *   GAP           — something required was never recorded.
 *   CONTRADICTION — two recorded figures disagree with each other.
 *   INVALID       — a recorded value is out of range or references nothing.
 *
 * Severity drives behaviour: a BLOCKING finding means the project record
 * cannot be registered as-is; WARNING and INFO are advisory.
 */

import { criteria as allCriteria, mandatoryCriteria } from "../data/criteria.js";
import { findProjectClass } from "../data/project-classes.js";
import { missingLifecycleData } from "./lifecycle.js";
import { round } from "./normalize.js";

export const SEVERITY = Object.freeze({
  BLOCKING: "blocking",
  WARNING: "warning",
  INFO: "info"
});

/**
 * Inspect one project.
 *
 * @param {Object} project
 * @param {Object} [options]
 * @returns {Object}
 */
export function inspectProject(project, options = {}) {
  const criteria = options.criteria ?? allCriteria;
  const findings = [];

  const add = (severity, code, message) =>
    findings.push({ severity, code, message });

  // ── GAP: unanswered mandatory criteria ───────────────────────────────
  const applicableGates = mandatoryCriteria.filter(
    gate =>
      gate.appliesTo === "all" ||
      (gate.appliesTo === "megaProject" &&
        project.classification?.megaProject === true)
  );

  applicableGates.forEach(gate => {
    const answer = project.mandatory?.[gate.code];

    if (answer === undefined || answer === null) {
      add(
        SEVERITY.BLOCKING,
        `mandatory:${gate.code}`,
        `پاسخ معیار الزامی «${gate.label}» ثبت نشده است؛ فرم ناقص قابل ثبت نیست.`
      );
    }
  });

  // ── GAP: criterion scores falling back to the dimension score ────────
  const missingCriterionScores = criteria.filter(
    criterion => !Number.isFinite(project.criterionScores?.[criterion.code])
  );

  const withoutDimensionFallback = missingCriterionScores.filter(
    criterion => !Number.isFinite(project.scores?.[criterion.dimension])
  );

  if (withoutDimensionFallback.length > 0) {
    add(
      SEVERITY.BLOCKING,
      "score:missing",
      `امتیاز معیارهای ${withoutDimensionFallback
        .map(criterion => criterion.code)
        .join("، ")} و امتیاز بعد مربوطه هر دو موجود نیستند.`
    );
  }

  const fallbackOnly = missingCriterionScores.length - withoutDimensionFallback.length;

  if (fallbackOnly > 0) {
    add(
      SEVERITY.WARNING,
      "score:fallback",
      `امتیاز ${fallbackOnly} معیار از امتیاز سطح بعد جایگزین شده است؛ برای استناد در گزارش رسمی باید در سطح معیار ثبت شود.`
    );
  }

  // ── GAP: in-progress projects missing required life-cycle inputs ─────
  if (project.classification?.projectClass === "inProgress") {
    missingLifecycleData(project).forEach(field =>
      add(
        SEVERITY.BLOCKING,
        `lifecycle:${field.field}`,
        `پروژه نیمه‌تمام بدون «${field.label}» قابل ارزیابی آینده‌نگر نیست.`
      )
    );
  }

  // ── CONTRADICTION: internally inconsistent figures ───────────────────
  const cashFlow = project.finance?.cashFlow ?? {};
  const cashFlowTotal = Object.values(cashFlow).reduce(
    (sum, amount) => sum + (amount ?? 0),
    0
  );
  const costToComplete = project.lifecycle?.costToComplete;

  if (Number.isFinite(costToComplete) && cashFlowTotal > 0) {
    const drift = Math.abs(cashFlowTotal - costToComplete) /
      Math.max(costToComplete, 1);

    if (drift > 0.05) {
      add(
        SEVERITY.WARNING,
        "finance:cashFlowMismatch",
        `مجموع جریان نقدی سالانه (${round(cashFlowTotal, 2)}) با هزینه تکمیل (${costToComplete}) ${round(drift * 100, 1)}٪ اختلاف دارد.`
      );
    }
  }

  const internal = project.finance?.internalSharePercent;
  const external = project.finance?.externalSharePercent;

  if (Number.isFinite(internal) && Number.isFinite(external)) {
    if (Math.abs(internal + external - 100) > 0.5) {
      add(
        SEVERITY.WARNING,
        "finance:shareMismatch",
        `مجموع سهم منابع داخلی و خارجی ${internal + external}٪ است و باید ۱۰۰٪ باشد.`
      );
    }
  }

  const physical = project.lifecycle?.physicalProgressPercent;

  if (Number.isFinite(physical) && Number.isFinite(project.progress)) {
    if (Math.abs(physical - project.progress) > 1) {
      add(
        SEVERITY.WARNING,
        "progress:mismatch",
        `درصد پیشرفت ثبت‌شده (${project.progress}) با پیشرفت فیزیکی چرخه عمر (${physical}) هم‌خوانی ندارد.`
      );
    }
  }

  // ── INVALID DATA ─────────────────────────────────────────────────────
  if (!findProjectClass(project.classification?.projectClass)) {
    add(
      SEVERITY.BLOCKING,
      "classification:unknown",
      `طبقه پروژه «${project.classification?.projectClass ?? "ثبت‌نشده"}» شناخته‌شده نیست؛ بدون طبقه، پروژه در ماتریس مقایسه قرار نمی‌گیرد.`
    );
  }

  const outOfRange = criteria.filter(criterion => {
    const value = project.criterionScores?.[criterion.code];

    return Number.isFinite(value) && (value < 0 || value > 100);
  });

  if (outOfRange.length > 0) {
    add(
      SEVERITY.BLOCKING,
      "score:outOfRange",
      `امتیاز معیارهای ${outOfRange.map(c => c.code).join("، ")} خارج از بازه ۰ تا ۱۰۰ است.`
    );
  }

  if (!Number.isFinite(project.budget) || project.budget <= 0) {
    add(
      SEVERITY.BLOCKING,
      "budget:invalid",
      "برآورد بودجه پروژه ثبت نشده یا نامعتبر است؛ پیشنهادهای فاقد برآورد دقیق قابل ثبت نیستند."
    );
  }

  const blocking = findings.filter(f => f.severity === SEVERITY.BLOCKING).length;
  const scored = criteria.length - missingCriterionScores.length;

  return {
    projectId: String(project.id),
    projectName: project.name,
    findings,
    blockingCount: blocking,
    warningCount: findings.filter(f => f.severity === SEVERITY.WARNING).length,
    /** How complete the project record is at criterion level, as a percentage. */
    criterionCompletenessPercent: round((scored / criteria.length) * 100, 1),
    registrable: blocking === 0
  };
}

/**
 * Inspect a project set and check the cross-project invariants a single
 * project cannot see: dangling dependencies and mutual conflicts.
 *
 * @param {Array} projects
 * @param {Object} [options]
 * @returns {Object}
 */
export function inspectProjects(projects, options = {}) {
  const reports = projects.map(project => inspectProject(project, options));
  const ids = new Set(projects.map(project => String(project.id)));
  const byId = new Map(reports.map(report => [report.projectId, report]));

  projects.forEach(project => {
    const report = byId.get(String(project.id));

    [
      ...(project.dependencies?.requires ?? []).map(id => ["requires", id]),
      ...(project.dependencies?.conflictsWith ?? []).map(id => ["conflictsWith", id])
    ].forEach(([relation, referenced]) => {
      if (!ids.has(String(referenced))) {
        report.findings.push({
          severity: SEVERITY.BLOCKING,
          code: `dependency:${relation}`,
          message: `پروژه ${referenced} که در وابستگی‌های «${relation}» ارجاع شده، در مجموعه پروژه‌ها وجود ندارد.`
        });
        report.blockingCount += 1;
        report.registrable = false;
      }
    });
  });

  return {
    reports,
    summary: {
      total: reports.length,
      registrable: reports.filter(report => report.registrable).length,
      blocking: reports.reduce((sum, report) => sum + report.blockingCount, 0),
      warnings: reports.reduce((sum, report) => sum + report.warningCount, 0),
      averageCompletenessPercent: round(
        reports.reduce(
          (sum, report) => sum + report.criterionCompletenessPercent,
          0
        ) / Math.max(1, reports.length),
        1
      )
    }
  };
}
