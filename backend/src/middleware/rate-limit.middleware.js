import env from "../config/env.js";
import * as audit from "../services/audit.service.js";
import { AUDIT_CATEGORY } from "../services/audit.service.js";
import HttpError from "../utils/http-error.js";

/**
 * محدودسازی نرخ و جلوگیری از مصرف بی‌رویه — «فاز ششم، بند ۲-۸».
 *
 * Two separate budgets, because the two resources fail differently:
 *
 *   - A general per-principal request limit, protecting the API from DoS.
 *   - A much tighter AI limit *plus* a token budget, because «پردازش مدل‌های AI
 *     معمولاً پرهزینه است؛ هم از نظر منابع محاسباتی و هم از نظر هزینه توکن».
 *     Counting requests alone does not bound spend — one request can burn a
 *     day's tokens — so the token budget is metered separately after the call.
 *
 * The store is in-process, which is correct for a single instance and is the
 * documented seam for Redis when the service is scaled horizontally.
 */

/**
 * A fixed-window counter store with lazy eviction.
 */
class WindowStore {
  constructor(windowMs, max) {
    this.windowMs = windowMs;
    this.max = max;
    this.entries = new Map();
  }

  /**
   * @param {string} key
   * @returns {{ allowed: boolean, remaining: number, resetAt: number, count: number }}
   */
  hit(key) {
    const now = Date.now();
    const entry = this.entries.get(key);

    if (!entry || entry.resetAt <= now) {
      const fresh = { count: 1, resetAt: now + this.windowMs };

      this.entries.set(key, fresh);
      this.evict(now);

      return {
        allowed: true,
        remaining: this.max - 1,
        resetAt: fresh.resetAt,
        count: 1
      };
    }

    entry.count += 1;

    return {
      allowed: entry.count <= this.max,
      remaining: Math.max(0, this.max - entry.count),
      resetAt: entry.resetAt,
      count: entry.count
    };
  }

  /**
   * Drop expired windows so the map cannot grow without bound — an unbounded
   * rate-limit store is itself a denial-of-service vector.
   *
   * @param {number} now
   */
  evict(now) {
    if (this.entries.size < 5000) {
      return;
    }

    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) {
        this.entries.delete(key);
      }
    }
  }
}

/**
 * Identify the subject of a limit: the authenticated principal where there is
 * one, otherwise the peer address. Keying on the principal means one user
 * cannot multiply their quota by rotating IPs.
 *
 * @param {import("express").Request} req
 * @returns {string}
 */
function subjectOf(req) {
  return req.principal?.id
    ? `user:${req.principal.id}`
    : `ip:${req.ip ?? "unknown"}`;
}

/**
 * Build a rate limiter.
 *
 * @param {Object} [options]
 * @param {number} [options.windowSeconds]
 * @param {number} [options.maxRequests]
 * @param {string} [options.name]
 * @returns {import("express").RequestHandler}
 */
export function rateLimit({
  windowSeconds = env.security.rateLimit.windowSeconds,
  maxRequests = env.security.rateLimit.maxRequests,
  name = "general"
} = {}) {
  const store = new WindowStore(windowSeconds * 1000, maxRequests);

  return (req, res, next) => {
    const key = `${name}:${subjectOf(req)}`;
    const result = store.hit(key);
    const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));

    res.setHeader("RateLimit-Limit", maxRequests);
    res.setHeader("RateLimit-Remaining", result.remaining);
    res.setHeader("RateLimit-Reset", retryAfter);

    if (result.allowed) {
      return next();
    }

    res.setHeader("Retry-After", retryAfter);

    audit.record({
      category: AUDIT_CATEGORY.SECURITY,
      action: "rateLimit.exceeded",
      outcome: "denied",
      requestId: req.id,
      actor: req.principal,
      detail: { limiter: name, path: req.path, count: result.count }
    });

    return next(
      new HttpError(429, "تعداد درخواست‌ها از حد مجاز بیشتر است؛ کمی بعد دوباره تلاش کنید.")
    );
  };
}

/**
 * Daily token budget for AI usage, metered per principal.
 *
 * Requests are admitted on the budget *remaining before* the call and the
 * actual usage is charged afterwards, because the cost of a completion is not
 * known until it returns. A principal can therefore overshoot by at most one
 * request, and is then locked out until the window rolls.
 */
class TokenBudget {
  constructor(dailyBudget) {
    this.dailyBudget = dailyBudget;
    this.usage = new Map();
  }

  /**
   * @param {string} key
   * @returns {{ used: number, resetAt: number }}
   */
  entryFor(key) {
    const now = Date.now();
    const existing = this.usage.get(key);

    if (existing && existing.resetAt > now) {
      return existing;
    }

    const fresh = { used: 0, resetAt: now + 24 * 60 * 60 * 1000 };

    this.usage.set(key, fresh);

    return fresh;
  }

  /**
   * @param {string} key
   * @returns {boolean}
   */
  hasBudget(key) {
    if (this.dailyBudget === 0) {
      return true;
    }

    return this.entryFor(key).used < this.dailyBudget;
  }

  /**
   * @param {string} key
   * @param {number} tokens
   */
  charge(key, tokens) {
    const entry = this.entryFor(key);

    entry.used += Number.isFinite(tokens) ? tokens : 0;
  }

  /**
   * @param {string} key
   * @returns {Object}
   */
  report(key) {
    const entry = this.entryFor(key);

    return {
      used: entry.used,
      budget: this.dailyBudget,
      remaining: this.dailyBudget === 0
        ? null
        : Math.max(0, this.dailyBudget - entry.used),
      resetAt: new Date(entry.resetAt).toISOString()
    };
  }
}

const tokenBudget = new TokenBudget(env.ai.dailyTokenBudget);

/**
 * Reject an AI request from a principal who has exhausted their token budget.
 *
 * @returns {import("express").RequestHandler}
 */
export function enforceTokenBudget() {
  return (req, res, next) => {
    const key = subjectOf(req);

    if (tokenBudget.hasBudget(key)) {
      req.tokenBudgetKey = key;

      return next();
    }

    audit.record({
      category: AUDIT_CATEGORY.SECURITY,
      action: "ai.tokenBudget.exhausted",
      outcome: "denied",
      requestId: req.id,
      actor: req.principal,
      detail: tokenBudget.report(key)
    });

    return next(
      new HttpError(
        429,
        "سهمیه روزانه استفاده از مدل زبانی به پایان رسیده است."
      )
    );
  };
}

/**
 * Charge tokens actually consumed by a completed AI call.
 *
 * @param {string} key
 * @param {number} tokens
 */
export function chargeTokens(key, tokens) {
  if (key) {
    tokenBudget.charge(key, tokens);
  }
}

/**
 * @param {string} key
 * @returns {Object}
 */
export function tokenBudgetReport(key) {
  return tokenBudget.report(key);
}

export default rateLimit;
