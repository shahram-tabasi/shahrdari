/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import crypto from "node:crypto";

import HttpError from "../utils/http-error.js";

/**
 * LANGUAGE-MODEL GOVERNANCE.
 *
 * Implements the directive's rules on what a language model may and may not do
 * [پیوست شماره دو — نقش هوش مصنوعی و نحوه استفاده مدل‌های زبانی].
 *
 * THE KEY POINT: these boundaries are enforced by CODE, not by a prompt. A
 * prompt telling a model to behave is a request it may ignore. This module is
 * the actual control.
 *
 * PERMITTED — assistive tasks only:
 *   extracting clauses from governing documents; proposing candidate criteria;
 *   preliminary matching of projects to strategic goals; summarising a
 *   proposal; flagging conflicts or gaps in a project record; extracting
 *   entities from text; explaining an engine result in plain language.
 *
 * FORBIDDEN without human approval:
 *   approving an official indicator; guessing missing data; setting a final
 *   project score; removing a project; making the final portfolio decision.
 *
 * These are not merely discouraged — they are structurally impossible here.
 * No code path in the AI layer writes to a criterion, a score, a project's
 * status or a portfolio. The model also has no tools, no database handle and
 * no filesystem access. The worst outcome of a successful prompt injection is
 * a misleading paragraph awaiting an expert's rejection.
 *
 * IF YOU ADD A NEW AI FEATURE: add its task to `AI_TASK` and
 * `TASK_DEFINITIONS` below. Do NOT add a code path that writes engine data on
 * the strength of a model response — route it through `recordSuggestion` and
 * require `reviewSuggestion` first.
 */

/**
 * The allowlist of tasks a language model may be asked to perform.
 * Anything not in this list is rejected before the model is ever called.
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
 * Actions the model may never take.
 *
 * Listed explicitly, and served over the API, so the boundary is discoverable
 * and testable rather than living only in documentation. The UI shows this
 * list to users so the limits of the assistant are visible in the product.
 */
export const FORBIDDEN_AI_ACTIONS = Object.freeze([
  { code: "approveIndicator", label: "تصویب شاخص رسمی" },
  { code: "guessMissingData", label: "حدس زدن اطلاعات مفقود" },
  { code: "assignFinalScore", label: "تعیین امتیاز قطعی پروژه" },
  { code: "removeProject", label: "حذف پروژه" },
  { code: "decidePortfolio", label: "اتخاذ تصمیم نهایی سبد" }
]);

/**
 * Review state of a suggestion. A suggestion starts PENDING and only an
 * authorised reviewer can move it to ACCEPTED or REJECTED.
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
 * The full policy — allowed tasks, forbidden actions and the human-in-the-loop
 * statement. Consumed by the UI and by the security design deliverable
 * [سند طراحی امنیت و سطوح دسترسی].
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
 * In-memory suggestion store.
 *
 * REPLACE THIS WITH A DATABASE TABLE before production — suggestions are part
 * of the audit record and must survive a restart. The record SHAPE below is
 * fixed by the directive and should be preserved exactly when you migrate it.
 */
const suggestions = new Map();

/**
 * Record a model output together with the provenance the directive requires
 * [الزامات کنترل خروجی هوش مصنوعی]:
 *
 *   source and page reference · supporting document text · model version ·
 *   processing timestamp · confidence · expert review status · revision
 *   history · reviewer name · reason for acceptance or rejection.
 *
 * Nothing recorded here affects any calculation. `appliedToDecision` stays
 * false until an authorised expert accepts it.
 *
 * @param {Object} input
 * @returns {Object} The stored suggestion.
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

    /** Who asked. */
    requestedBy: actor
      ? { id: actor.id, name: actor.name, role: actor.role }
      : null,
    /** What they asked. */
    prompt,
    /** What the model answered. */
    output,

    /** Model version that produced it. */
    model,
    /** Processing timestamp. */
    processedAt: new Date().toISOString(),
    /**
     * Confidence. Null means the model gave no calibrated confidence value.
     * That is recorded honestly rather than filled with an invented number —
     * inventing one is exactly what the directive forbids.
     */
    confidence,
    /** Source reference and supporting document text. */
    sources,
    usage,
    guardrailFindings,

    /** Expert review status. */
    reviewStatus: REVIEW_STATUS.PENDING,
    /** Reviewer identity, once reviewed. */
    reviewedBy: null,
    reviewedAt: null,
    /** Reason given for acceptance or rejection. */
    reviewReason: null,
    /** Revision history; the original output is never overwritten. */
    revisions: [],

    /**
     * THE LOAD-BEARING FIELD. Until an authorised expert accepts this
     * suggestion, it has no effect on any score, criterion or portfolio.
     * Never set this to true anywhere except in `reviewSuggestion`.
     */
    appliedToDecision: false
  };

  suggestions.set(id, suggestion);

  return suggestion;
}

/**
 * Record an expert's decision on a suggestion — the human-in-the-loop step
 * [تأیید کارشناس].
 *
 * A reason is required for ACCEPTANCE as well as rejection: an unexplained
 * approval is not an audit trail. A correction never overwrites the model's
 * original output; it is appended to `revisions` so the original stays
 * inspectable.
 *
 * @param {string} id
 * @param {Object} review
 * @param {string} review.status ACCEPTED or REJECTED.
 * @param {Object} review.reviewer The authenticated principal.
 * @param {string} review.reason Mandatory justification.
 * @param {string} [review.correctedOutput] Edited text, if the expert amended it.
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

  // A correction is appended, never applied in place: the model's original
  // output must stay inspectable after an expert edits it.
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
