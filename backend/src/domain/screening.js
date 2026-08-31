/**
 * فیلتر شماره یک — the mandatory-criteria gate.
 *
 * The شیوه‌نامه is unambiguous about the semantics: «معیارهای الزامی، معیارهایی
 * هستند که ماهیت صفر و یک دارند و اگر … پروژه‌ای یکی از آن‌ها را نداشته باشد
 * کنار گذاشته شده و دیگر با سایر پروژه‌ها مورد مقایسه و بررسی قرار نمی‌گیرد».
 *
 * A failed gate is therefore an exclusion, never a score penalty. The engine
 * also fails *closed*: a project whose answer to a mandatory criterion is
 * simply absent is rejected as unanswered, rather than being waved through on
 * the assumption that silence means compliance.
 */

import { mandatoryCriteria } from "../data/criteria.js";

/**
 * Outcome of screening a single project.
 */
export const SCREENING_RESULT = Object.freeze({
  PASSED: "passed",
  REJECTED: "rejected"
});

/**
 * Does a mandatory criterion apply to this project?
 *
 * @param {Object} criterion
 * @param {Object} project
 * @returns {boolean}
 */
function applies(criterion, project) {
  if (criterion.appliesTo === "all") {
    return true;
  }

  if (criterion.appliesTo === "megaProject") {
    return project.classification?.megaProject === true;
  }

  return false;
}

/**
 * Screen one project against the mandatory criteria.
 *
 * @param {Object} project
 * @param {Array} [gates] Defaults to the full mandatory set.
 * @returns {Object}
 */
export function screenProject(project, gates = mandatoryCriteria) {
  const applicable = gates.filter(criterion => applies(criterion, project));
  const failed = [];
  const unanswered = [];

  applicable.forEach(criterion => {
    const answer = project.mandatory?.[criterion.code];

    if (answer === undefined || answer === null) {
      unanswered.push({ code: criterion.code, label: criterion.label });

      return;
    }

    if (answer !== true) {
      failed.push({ code: criterion.code, label: criterion.label });
    }
  });

  const blocking = [...failed, ...unanswered];

  return {
    projectId: String(project.id),
    projectName: project.name,
    result: blocking.length === 0
      ? SCREENING_RESULT.PASSED
      : SCREENING_RESULT.REJECTED,
    applicableCount: applicable.length,
    failed,
    unanswered,
    reason: blocking.length === 0
      ? null
      : `پروژه در فیلتر شماره یک رد شد: ${blocking
          .map(item => item.label)
          .join("، ")}`
  };
}

/**
 * Screen a project set, returning the projects that may enter the comparison
 * matrix alongside a full record of why the others did not.
 *
 * @param {Array} projects
 * @param {Array} [gates]
 * @returns {{ passed: Array, rejected: Array, report: Array }}
 */
export function screenProjects(projects, gates = mandatoryCriteria) {
  const report = projects.map(project => screenProject(project, gates));
  const passedIds = new Set(
    report
      .filter(entry => entry.result === SCREENING_RESULT.PASSED)
      .map(entry => entry.projectId)
  );

  return {
    passed: projects.filter(project => passedIds.has(String(project.id))),
    rejected: projects.filter(project => !passedIds.has(String(project.id))),
    report
  };
}
