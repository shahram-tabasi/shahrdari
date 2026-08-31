import crypto from "node:crypto";

import HttpError from "../utils/http-error.js";

/**
 * حاکمیت هوش مصنوعی — «مشخص شدن نقش هوش مصنوعی و نحوه استفاده مدل‌های زبانی».
 *
 * پیوست شماره دو draws a hard boundary that the code, not a prompt, has to
 * enforce. A prompt asking the model to behave is a request; this module is
 * the control.
 *
 * Permitted (assistive only):
 *   استخراج بندهای مرتبط از اسناد بالادستی · پیشنهاد اولیه معیارها · تطبیق
 *   اولیه پروژه‌ها با اهداف راهبردی · خلاصه‌سازی پیشنهادهای پروژه · شناسایی
 *   تعارض یا نقص در شناسنامه پروژه · استخراج موجودیت‌ها · تولید توضیح
 *   قابل‌فهم برای نتایج مدل.
 *
 * Forbidden without human approval — and these are not merely discouraged,
 * they are structurally impossible here, because no AI code path writes to a
 * criterion, a score, a project's status or a portfolio:
 *   شاخص رسمی تصویب کند · اطلاعات مفقود را حدس بزند · امتیاز قطعی پروژه تعیین
 *   کند · پروژه‌ای را حذف کند · تصمیم نهایی سبد را اتخاذ کند.
 */

/**
 * The tasks a language model may be asked to perform.
 */
export const AI_TASK = Object.freeze({
  EXTRACT_CLAUSES: "extractClauses",
  SUGGEST_CRITERIA: "suggestCriteria",
  MATCH_STRATEGY: "matchStrategy",
  SUMMARIZE_PROPOSAL: "summarizeProposal",
  DETECT_CONFLICTS: "detectConflicts",
  EXTRACT_ENTITIES: "extractEntities",
  EXPLAIN_RESULT: "explainResult"
});

const TASK_DEFINITIONS = Object.freeze({
  [AI_TASK.EXTRACT_CLAUSES]: {
    label: "استخراج بندهای مرتبط از اسناد بالادستی",
    requiresSource: true,
    outputIsSuggestion: true
  },
  [AI_TASK.SUGGEST_CRITERIA]: {
    label: "پیشنهاد اولیه معیارها",
    requiresSource: false,
    outputIsSuggestion: true
  },
  [AI_TASK.MATCH_STRATEGY]: {
    label: "تطبیق اولیه پروژه‌ها با اهداف راهبردی",
    requiresSource: false,
    outputIsSuggestion: true
  },
  [AI_TASK.SUMMARIZE_PROPOSAL]: {
    label: "خلاصه‌سازی پیشنهادهای پروژه",
    requiresSource: false,
    outputIsSuggestion: false
  },
  [AI_TASK.DETECT_CONFLICTS]: {
    label: "شناسایی تعارض یا نقص در شناسنامه پروژه",
    requiresSource: false,
    outputIsSuggestion: true
  },
  [AI_TASK.EXTRACT_ENTITIES]: {
    label: "استخراج موجودیت‌ها و اطلاعات از متون",
    requiresSource: true,
    outputIsSuggestion: true
  },
  [AI_TASK.EXPLAIN_RESULT]: {
    label: "تولید توضیح قابل‌فهم برای نتایج مدل",
    requiresSource: false,
    outputIsSuggestion: false
  }
});

/**
 * Actions the model may never take. Listed explicitly so the boundary is
 * discoverable in the API and testable, rather than living only in prose.
 */
export const FORBIDDEN_AI_ACTIONS = Object.freeze([
  { code: "approveIndicator", label: "تصویب شاخص رسمی" },
  { code: "guessMissingData", label: "حدس زدن اطلاعات مفقود" },
  { code: "assignFinalScore", label: "تعیین امتیاز قطعی پروژه" },
  { code: "removeProject", label: "حذف پروژه" },
  { code: "decidePortfolio", label: "اتخاذ تصمیم نهایی سبد" }
]);

/**
 * Review state of an AI suggestion.
 */
export const REVIEW_STATUS = Object.freeze({
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected"
});

/**
 * @param {string} task
 * @returns {Object}
 * @throws {HttpError} 400 when the task is not on the allowlist.
 */
export function assertAllowedTask(task) {
  const definition = TASK_DEFINITIONS[task];

  if (!definition) {
    throw new HttpError(
      400,
      "این نوع درخواست برای مدل زبانی مجاز نیست.",
      [
        {
          field: "task",
          message: `کارهای مجاز: ${Object.keys(TASK_DEFINITIONS).join("، ")}`
        }
      ]
    );
  }

  return definition;
}

/**
 * The list of allowed and forbidden operations, for the UI and for the
 * «سند طراحی امنیت و سطوح دسترسی» deliverable.
 *
 * @returns {Object}
 */
export function describePolicy() {
  return {
    allowedTasks: Object.entries(TASK_DEFINITIONS).map(([key, definition]) => ({
      key,
      ...definition
    })),
    forbiddenActions: FORBIDDEN_AI_ACTIONS,
    humanInTheLoop:
      "هر خروجی مدل زبانی یک «پیشنهاد» است و تا زمانی که کارشناس مجاز آن را تأیید نکند، در هیچ محاسبه، امتیاز یا تصمیم سبدی اثر ندارد."
  };
}

/**
 * In-memory suggestion store. The seam for the municipality's database; the
 * record shape is what matters and is fixed by the شیوه‌نامه.
 */
const suggestions = new Map();

/**
 * Create the provenance record پیوست شماره دو requires for every AI output:
 *
 *   منبع و شماره صفحه · متن مستند پشتیبان · نسخه مدل · تاریخ و زمان پردازش ·
 *   میزان اطمینان · وضعیت تأیید کارشناس · سابقه اصلاح · نام تأییدکننده ·
 *   دلیل پذیرش یا رد پیشنهاد.
 *
 * @param {Object} input
 * @returns {Object}
 */
export function recordSuggestion({
  task,
  requestId,
  actor,
  prompt,
  output,
  model,
  confidence = null,
  sources = [],
  guardrailFindings = [],
  usage = null
}) {
  const definition = assertAllowedTask(task);

  if (definition.requiresSource && sources.length === 0) {
    throw new HttpError(
      422,
      "این نوع خروجی بدون ذکر منبع و شماره صفحه قابل ثبت نیست."
    );
  }

  const id = crypto.randomUUID();

  const suggestion = {
    id,
    task,
    taskLabel: definition.label,
    requestId: requestId ?? null,

    /** چه کسی پرسید؟ */
    requestedBy: actor
      ? { id: actor.id, name: actor.name, role: actor.role }
      : null,
    /** چه چیزی پرسید؟ */
    prompt,
    /** مدل چه پاسخی داد؟ */
    output,

    /** نسخه مدل */
    model,
    /** تاریخ و زمان پردازش */
    processedAt: new Date().toISOString(),
    /**
     * میزان اطمینان. Null means the model gave no calibrated confidence — which
     * is recorded honestly rather than filled with an invented number, since
     * inventing one is exactly what the شیوه‌نامه forbids.
     */
    confidence,
    /** منبع و شماره صفحه، متن مستند پشتیبان */
    sources,
    usage,
    guardrailFindings,

    /** وضعیت تأیید کارشناس */
    reviewStatus: REVIEW_STATUS.PENDING,
    /** نام تأییدکننده */
    reviewedBy: null,
    reviewedAt: null,
    /** دلیل پذیرش یا رد پیشنهاد */
    reviewReason: null,
    /** سابقه اصلاح */
    revisions: [],

    /**
     * The load-bearing field: until an authorised expert accepts it, this
     * suggestion has no effect on any score, criterion or portfolio.
     */
    appliedToDecision: false
  };

  suggestions.set(id, suggestion);

  return suggestion;
}

/**
 * Record an expert's decision on a suggestion — تأیید کارشناس.
 *
 * @param {string} id
 * @param {Object} review
 * @param {string} review.status
 * @param {Object} review.reviewer
 * @param {string} review.reason
 * @param {string} [review.correctedOutput]
 * @returns {Object}
 */
export function reviewSuggestion(id, { status, reviewer, reason, correctedOutput }) {
  const suggestion = suggestions.get(id);

  if (!suggestion) {
    throw new HttpError(404, "پیشنهاد مورد نظر یافت نشد.");
  }

  if (status !== REVIEW_STATUS.ACCEPTED && status !== REVIEW_STATUS.REJECTED) {
    throw new HttpError(400, "وضعیت بازبینی باید «accepted» یا «rejected» باشد.");
  }

  if (!reason || reason.trim().length === 0) {
    // The appendix requires a recorded reason for acceptance as well as
    // rejection; an unexplained approval is not an audit trail.
    throw new HttpError(400, "ثبت دلیل پذیرش یا رد پیشنهاد الزامی است.");
  }

  if (suggestion.reviewStatus !== REVIEW_STATUS.PENDING) {
    throw new HttpError(
      409,
      "این پیشنهاد قبلاً بازبینی شده است؛ برای تغییر، اصلاحیه ثبت کنید."
    );
  }

  // سابقه اصلاح — a correction never overwrites the model's original output.
  if (correctedOutput && correctedOutput !== suggestion.output) {
    suggestion.revisions.push({
      at: new Date().toISOString(),
      by: { id: reviewer.id, name: reviewer.name, role: reviewer.role },
      previousOutput: suggestion.output,
      newOutput: correctedOutput,
      reason
    });

    suggestion.output = correctedOutput;
  }

  suggestion.reviewStatus = status;
  suggestion.reviewedBy = {
    id: reviewer.id,
    name: reviewer.name,
    role: reviewer.role
  };
  suggestion.reviewedAt = new Date().toISOString();
  suggestion.reviewReason = reason;
  suggestion.appliedToDecision = status === REVIEW_STATUS.ACCEPTED;

  return suggestion;
}

/**
 * @param {string} id
 * @returns {Object}
 */
export function getSuggestion(id) {
  const suggestion = suggestions.get(id);

  if (!suggestion) {
    throw new HttpError(404, "پیشنهاد مورد نظر یافت نشد.");
  }

  return suggestion;
}

/**
 * @param {Object} [filter]
 * @returns {Array}
 */
export function listSuggestions({ status = null, limit = 50 } = {}) {
  const all = [...suggestions.values()].sort(
    (left, right) => right.processedAt.localeCompare(left.processedAt)
  );

  return (status ? all.filter(entry => entry.reviewStatus === status) : all).slice(
    0,
    limit
  );
}
