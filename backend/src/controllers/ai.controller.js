import * as aiService from "../services/ai.service.js";
import { chargeTokens, tokenBudgetReport } from "../middleware/rate-limit.middleware.js";
import { successResponse } from "../utils/api-response.js";

/**
 * AI endpoints.
 *
 * Request bodies are validated by middleware before reaching these handlers, so
 * nothing here re-parses user input. What the controller does own is charging
 * the token budget after a completed call — the cost is only known once the
 * model has answered.
 */

/**
 * Report whether the assistant is available and what the policy allows.
 */
export function getStatus(req, res) {
  res.status(200).json(
    successResponse({
      message: "وضعیت دستیار هوشمند بازیابی شد.",
      data: {
        ...aiService.availability(),
        tokenBudget: req.principal
          ? tokenBudgetReport(`user:${req.principal.id}`)
          : null
      }
    })
  );
}

/**
 * Run an assistive task.
 */
export async function runTask(req, res, next) {
  try {
    const result = await aiService.runTask({
      task: req.body.task,
      message: req.body.message,
      projectIds: req.body.projectIds,
      actor: req.principal,
      requestId: req.id
    });

    // Meter the tokens this call actually consumed («محدودیت تعداد توکن»).
    chargeTokens(req.tokenBudgetKey, result.usage?.totalTokens ?? 0);

    res.status(200).json(
      successResponse({
        message: "پیشنهاد مدل زبانی تولید شد و در انتظار تأیید کارشناس است.",
        data: result,
        meta: { tokenBudget: tokenBudgetReport(req.tokenBudgetKey) }
      })
    );
  } catch (error) {
    next(error);
  }
}

/**
 * List AI suggestions awaiting or having received expert review.
 */
export function listSuggestions(req, res, next) {
  try {
    res.status(200).json(
      successResponse({
        message: "پیشنهادهای مدل زبانی بازیابی شد.",
        data: aiService.listSuggestions(req.query)
      })
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve one suggestion with its full provenance record.
 */
export function getSuggestion(req, res, next) {
  try {
    res.status(200).json(
      successResponse({
        message: "پیشنهاد بازیابی شد.",
        data: aiService.getSuggestion(req.params.id)
      })
    );
  } catch (error) {
    next(error);
  }
}

/**
 * تأیید کارشناس — the human-in-the-loop decision on a suggestion.
 */
export function reviewSuggestion(req, res, next) {
  try {
    const suggestion = aiService.reviewSuggestion({
      id: req.params.id,
      status: req.body.status,
      reason: req.body.reason,
      correctedOutput: req.body.correctedOutput,
      actor: req.principal,
      requestId: req.id
    });

    res.status(200).json(
      successResponse({
        message: "نتیجه بازبینی کارشناس ثبت شد.",
        data: suggestion
      })
    );
  } catch (error) {
    next(error);
  }
}
