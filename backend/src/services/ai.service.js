/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import { createChatCompletion, isAvailable } from "../providers/llm.provider.js";
import env from "../config/env.js";
import { screenInput, screenOutput } from "../security/guardrails.js";
import * as audit from "./audit.service.js";
import { AUDIT_CATEGORY } from "./audit.service.js";
import * as governance from "./ai-governance.service.js";
import * as contextBuilder from "./context-builder.service.js";
import { buildPrompt } from "./prompt-builder.service.js";
import HttpError from "../utils/http-error.js";

/**
 * AI orchestration.
 *
 * Every request follows the same fixed path, and each step is a control the
 * security standard or the directive requires:
 *
 *   1. task allowlist          — only approved assistive tasks are accepted
 *   2. input guardrail         — screen the prompt for injection attempts
 *   3. availability check      — degraded mode when no model is configured
 *   4. least-privilege context — the model sees only what the task needs
 *   5. model call              — bounded output, NO tools attached
 *   6. output guardrail        — screen for PII and system-prompt leakage
 *   7. provenance record       — store the output with its full audit record
 *   8. audit entry             — who asked, what, and what came back
 *
 * The model is given no tools, no database handle and no filesystem access.
 * That is deliberate: the least-privilege requirement is met by the model
 * having nothing to call, so a successful prompt injection can produce a
 * misleading paragraph and nothing more.
 */

/**
 * Whether the assistant can serve requests, and what still works if it cannot.
 *
 * @returns {Object}
 */
export function availability() {
  return {
    available: isAvailable(),
    model: isAvailable() ? env.ai.model : null,
    degradedMode: isAvailable()
      ? null
      : "مدل زبانی پیکربندی نشده است. غربالگری، وزن‌دهی، رتبه‌بندی، بهینه‌سازی سبد و تحلیل حساسیت بدون وابستگی به مدل زبانی کار می‌کنند.",
    policy: governance.describePolicy()
  };
}

/**
 * Run an assistive AI task.
 *
 * @param {Object} request
 * @param {string} request.task
 * @param {string} request.message
 * @param {string[]} [request.projectIds]
 * @param {Object} request.actor
 * @param {string} [request.requestId]
 * @returns {Promise<Object>}
 */
export async function runTask({ task, message, projectIds, actor, requestId }) {
  // 1 — allowlist.
  governance.assertAllowedTask(task);

  // 2 — input guardrail.
  //
  // Screening runs *before* the availability check on purpose. An injection or
  // a forbidden-action attempt is a security event in its own right and has to
  // be detected and audited whether or not a model happens to be configured;
  // checking availability first would mean every such attempt during an AI
  // outage returned a bland 503 and left no trace.
  const screened = screenInput(message, {
    maxCharacters: env.ai.maxInputCharacters
  });

  audit.record({
    category: AUDIT_CATEGORY.AI_REQUEST,
    action: "ai.task.requested",
    outcome: screened.safe ? "success" : "denied",
    requestId,
    actor,
    detail: {
      task,
      promptLength: screened.normalized.length,
      projectIds: projectIds ?? null,
      guardrailFindings: screened.findings
    }
  });

  if (!screened.safe) {
    throw new HttpError(
      400,
      "درخواست شما توسط لایه محافظ مدل زبانی مسدود شد.",
      screened.findings.map(finding => ({
        field: "message",
        message: finding.message
      }))
    );
  }

  // 3 — availability. Checked only once the request is known to be legitimate.
  if (!isAvailable()) {
    throw new HttpError(
      503,
      "سرویس مدل زبانی در دسترس نیست؛ تحلیل‌های محاسباتی سامانه بدون آن در دسترس هستند."
    );
  }

  // 4 — least-privilege context.
  const context = await contextBuilder.buildContext({ task, projectIds });

  // 5 — model call.
  const prompt = buildPrompt({ task, message: screened.normalized, context });
  const response = await createChatCompletion(prompt, {
    temperature: 0.2,
    maxOutputTokens: env.ai.maxOutputTokens
  });

  // 6 — output guardrail.
  const guarded = screenOutput(response.output_text ?? "");

  if (!guarded.safe) {
    audit.record({
      category: AUDIT_CATEGORY.AI_RESPONSE,
      action: "ai.response.blocked",
      outcome: "denied",
      requestId,
      actor,
      detail: { task, model: response.model, findings: guarded.findings }
    });

    throw new HttpError(
      502,
      "پاسخ مدل زبانی توسط لایه محافظ مسدود شد و ارائه نمی‌شود."
    );
  }

  // 7 — provenance record. Nothing here is applied to any decision.
  const suggestion = governance.recordSuggestion({
    task,
    requestId,
    actor,
    prompt: screened.normalized,
    output: guarded.output,
    model: response.model ?? env.ai.model,
    confidence: null,
    sources: context.scope?.length
      ? [
          {
            document: "applicationContext",
            scope: context.scope,
            generatedAt: context.generatedAt
          }
        ]
      : [],
    guardrailFindings: [...screened.findings, ...guarded.findings],
    usage: response.usage
      ? {
          inputTokens: response.usage.input_tokens ?? null,
          outputTokens: response.usage.output_tokens ?? null,
          totalTokens: response.usage.total_tokens ?? null
        }
      : null
  });

  // 8 — audit.
  audit.record({
    category: AUDIT_CATEGORY.AI_RESPONSE,
    action: "ai.task.answered",
    requestId,
    actor,
    detail: {
      task,
      suggestionId: suggestion.id,
      model: suggestion.model,
      contextScope: context.scope,
      toolsInvoked: [],
      usage: suggestion.usage,
      guardrailFindings: guarded.findings,
      reviewStatus: suggestion.reviewStatus
    }
  });

  return {
    suggestionId: suggestion.id,
    task,
    taskLabel: suggestion.taskLabel,
    output: suggestion.output,
    model: suggestion.model,
    processedAt: suggestion.processedAt,
    usage: suggestion.usage,
    contextScope: context.scope,
    guardrailFindings: guarded.findings,
    reviewStatus: suggestion.reviewStatus,
    appliedToDecision: suggestion.appliedToDecision,
    notice:
      "این خروجی یک پیشنهاد است و تا تأیید کارشناس مجاز، در هیچ امتیاز، رتبه یا تصمیم سبدی اثر ندارد."
  };
}

/**
 * Record an expert's review of a suggestion — the human-in-the-loop step.
 *
 * @param {Object} input
 * @returns {Object}
 */
export function reviewSuggestion({ id, status, reason, correctedOutput, actor, requestId }) {
  const suggestion = governance.reviewSuggestion(id, {
    status,
    reviewer: actor,
    reason,
    correctedOutput
  });

  audit.record({
    category: AUDIT_CATEGORY.AI_REVIEW,
    action: "ai.suggestion.reviewed",
    requestId,
    actor,
    detail: {
      suggestionId: suggestion.id,
      task: suggestion.task,
      status: suggestion.reviewStatus,
      reason: suggestion.reviewReason,
      corrected: suggestion.revisions.length > 0,
      appliedToDecision: suggestion.appliedToDecision
    }
  });

  return suggestion;
}

export { listSuggestions, getSuggestion } from "./ai-governance.service.js";
