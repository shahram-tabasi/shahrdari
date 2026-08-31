/**
 * محافظ‌های LLM و ایزوله‌سازی — «فاز سوم، بند ۱-۵».
 *
 * «مدل LLM نباید مستقیماً بدون کنترل با کاربر، داده‌ها یا ابزارهای اجرایی در
 *  ارتباط باشد. باید یک لایه کنترلی یا Guardrail وجود داشته باشد.»
 *
 * This module is that layer. It runs on the way in (prompt-injection screening,
 * size limits) and on the way out (PII detection, system-prompt leakage,
 * unsafe-claim detection) and every decision it makes is reported to the
 * caller and to the audit log rather than applied silently.
 *
 * Its limits should be stated plainly: pattern matching catches known and
 * careless injection attempts, not a determined novel one. It is one layer of
 * defence in depth — the ones that actually contain a successful injection are
 * the *absence of tools* on this model, the least-privilege data context, and
 * the rule that no AI output changes a score or a portfolio without a human
 * approving it. Those are enforced in `ai-governance.service.js`.
 */

/**
 * Instruction-override patterns, in the two languages the system is used in.
 */
const INJECTION_PATTERNS = [
  { code: "override-instructions", pattern: /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?/i },
  { code: "override-instructions", pattern: /disregard\s+(?:all\s+)?(?:previous|prior|the\s+above)/i },
  { code: "override-instructions", pattern: /دستور(?:ات|های)?\s+(?:قبلی|بالا|پیشین)\s+را\s+(?:نادیده|فراموش)/i },
  { code: "reveal-system-prompt", pattern: /(?:reveal|show|print|repeat|output)\s+(?:your\s+)?(?:system\s+prompt|instructions|rules)/i },
  { code: "reveal-system-prompt", pattern: /(?:دستور(?:ات)?\s+سیستم|پرامپت\s+سیستم).{0,20}(?:بگو|نمایش|چاپ)/i },
  { code: "role-hijack", pattern: /you\s+are\s+now\s+(?:a|an|the)\s+/i },
  { code: "role-hijack", pattern: /\b(?:act|behave|pretend)\s+as\s+(?:if\s+you\s+are\s+)?(?:a|an|the)\s+/i },
  { code: "role-hijack", pattern: /از\s+این\s+پس\s+تو\s+/i },
  { code: "developer-mode", pattern: /\b(?:developer|god|dan|jailbreak|unrestricted)\s+mode\b/i },
  { code: "fake-turn", pattern: /^\s*(?:system|assistant|developer)\s*[:：]/im },
  { code: "fake-turn", pattern: /<\|(?:im_start|im_end|system|endoftext)\|>/i },
  { code: "exfiltration", pattern: /\b(?:base64|rot13)\s*(?:encode|decode)\b.{0,40}(?:key|token|secret|prompt)/i },
  { code: "authority-claim", pattern: /\b(?:as|i am)\s+(?:the\s+)?(?:admin|administrator|system\s+owner|developer)\b/i },
  { code: "authority-claim", pattern: /من\s+(?:مدیر\s+سامانه|ادمین)\s+هستم/i }
];

/**
 * Direct attempts to make the model do what the شیوه‌نامه forbids it doing
 * without human approval. These are screened at the prompt, not only at the
 * response, so the attempt itself is recorded.
 */
const FORBIDDEN_REQUEST_PATTERNS = [
  { code: "final-decision", pattern: /(?:سبد\s+(?:نهایی|پروژه)\s+را\s+(?:نهایی|تصویب|انتخاب))/i },
  { code: "final-decision", pattern: /\b(?:approve|finali[sz]e)\s+the\s+portfolio\b/i },
  { code: "assign-score", pattern: /امتیاز\s+(?:قطعی|نهایی)\s+.{0,30}(?:بده|تعیین\s+کن|بگذار)/i },
  { code: "assign-score", pattern: /\bassign\s+(?:a\s+)?final\s+scores?\b/i },
  { code: "remove-project", pattern: /پروژه\s+.{0,30}\s+را\s+(?:حذف|رد)\s+کن/i },
  { code: "remove-project", pattern: /\b(?:delete|remove|reject)\s+(?:the\s+)?project\b/i },
  { code: "guess-missing", pattern: /(?:اطلاعات|داده)(?:‌های)?\s+(?:مفقود|ناقص|نامشخص)\s+را\s+(?:حدس|تخمین|پر)/i },
  { code: "guess-missing", pattern: /\b(?:guess|make\s+up|invent|estimate)\s+the\s+missing\b/i }
];

/**
 * PII patterns for outbound screening — «خروجی‌ها را برای افشای PII بررسی کند».
 * Iranian identifiers are included because a generic English-language PII
 * detector would miss every one of them.
 */
const PII_PATTERNS = [
  { code: "national-id", pattern: /\b\d{10}\b/g, label: "کد ملی" },
  { code: "iran-mobile", pattern: /\b(?:\+98|0)9\d{9}\b/g, label: "شماره همراه" },
  { code: "iban", pattern: /\bIR\d{24}\b/gi, label: "شماره شبا" },
  { code: "card", pattern: /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, label: "شماره کارت" },
  { code: "email", pattern: /\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b/g, label: "نشانی رایانامه" },
  { code: "postal-code", pattern: /\b\d{5}-?\d{5}\b/g, label: "کد پستی" }
];

/**
 * Fragments of our own system prompt. If any of these appear in a model
 * response, the prompt has leaked and the response must not be returned.
 */
const SYSTEM_PROMPT_MARKERS = [
  "شما دستیار تحلیلی",
  "تحت هیچ شرایطی",
  "applicationContext",
  "allowedTasks"
];

/**
 * Screen an inbound prompt.
 *
 * @param {string} input
 * @param {Object} [options]
 * @param {number} [options.maxCharacters]
 * @returns {{ safe: boolean, findings: Array, normalized: string }}
 */
export function screenInput(input, { maxCharacters = 8000 } = {}) {
  const findings = [];

  if (typeof input !== "string") {
    return {
      safe: false,
      findings: [{ code: "invalid-type", severity: "block", message: "ورودی باید متن باشد." }],
      normalized: ""
    };
  }

  // Normalise first: zero-width characters and unusual Unicode forms are a
  // standard way to slip a pattern past a matcher while still reading normally
  // to the model.
  const normalized = input
    .normalize("NFKC")
    .replace(/[​-‏‪-‮⁠-⁤﻿]/g, "")
    .trim();

  if (normalized.length === 0) {
    findings.push({
      code: "empty",
      severity: "block",
      message: "پرسش خالی است."
    });
  }

  if (normalized.length > maxCharacters) {
    findings.push({
      code: "too-long",
      severity: "block",
      message: `طول ورودی از حد مجاز (${maxCharacters} نویسه) بیشتر است.`
    });
  }

  INJECTION_PATTERNS.forEach(({ code, pattern }) => {
    if (pattern.test(normalized)) {
      findings.push({
        code,
        severity: "block",
        message: "الگوی تزریق پرامپت در ورودی شناسایی شد."
      });
    }
  });

  FORBIDDEN_REQUEST_PATTERNS.forEach(({ code, pattern }) => {
    if (pattern.test(normalized)) {
      findings.push({
        code,
        severity: "block",
        message:
          "این درخواست از مدل زبانی می‌خواهد اقدامی انجام دهد که طبق شیوه‌نامه بدون تأیید انسانی مجاز نیست."
      });
    }
  });

  // De-duplicate: one pattern family firing three times is one finding.
  const unique = [...new Map(findings.map(f => [f.code, f])).values()];

  return {
    safe: unique.every(finding => finding.severity !== "block"),
    findings: unique,
    normalized
  };
}

/**
 * Redact PII from a string, returning the redacted text and what was found.
 *
 * @param {string} text
 * @returns {{ text: string, findings: Array }}
 */
export function redactPii(text) {
  const findings = [];

  const redacted = PII_PATTERNS.reduce((current, { code, pattern, label }) => {
    // A fresh regex per call: a shared /g regex carries `lastIndex` between
    // calls and silently skips matches.
    const matcher = new RegExp(pattern.source, pattern.flags);
    let count = 0;

    const next = current.replace(matcher, () => {
      count += 1;

      return `[${label} حذف شد]`;
    });

    if (count > 0) {
      findings.push({ code, label, count });
    }

    return next;
  }, text);

  return { text: redacted, findings };
}

/**
 * Screen a model response before it reaches the user.
 *
 * @param {string} output
 * @returns {{ safe: boolean, output: string, findings: Array }}
 */
export function screenOutput(output) {
  const findings = [];

  if (typeof output !== "string" || output.trim().length === 0) {
    return {
      safe: false,
      output: "",
      findings: [{ code: "empty-response", severity: "block", message: "پاسخ مدل خالی بود." }]
    };
  }

  // افشای system prompt — the response is withheld entirely, not redacted:
  // a leaked prompt means the model is not following instructions, so nothing
  // else in that response can be trusted either.
  const leaked = SYSTEM_PROMPT_MARKERS.some(marker => output.includes(marker));

  if (leaked) {
    return {
      safe: false,
      output: "",
      findings: [
        {
          code: "system-prompt-leak",
          severity: "block",
          message: "پاسخ مدل حاوی دستورهای داخلی بود و ارائه نشد."
        }
      ]
    };
  }

  const { text, findings: piiFindings } = redactPii(output);

  piiFindings.forEach(finding =>
    findings.push({
      code: `pii:${finding.code}`,
      severity: "redacted",
      message: `${finding.count} مورد ${finding.label} از پاسخ حذف شد.`
    })
  );

  return { safe: true, output: text, findings };
}

/**
 * Strip the fields that must never leave the municipality's network when the
 * context is handed to an external model.
 *
 * «چه داده‌هایی باید ناشناس‌سازی شوند» — the answer implemented here is: any
 * free-text narrative that may name a person, and any contact or identity
 * field. The decision-relevant numbers stay, because the model cannot help
 * reason about a portfolio it cannot see.
 *
 * @param {*} value
 * @param {number} [depth]
 * @returns {*}
 */
export function anonymizeContext(value, depth = 0) {
  const IDENTITY_KEYS = new Set([
    "actor",
    "approver",
    "contact",
    "email",
    "phone",
    "nationalId",
    "owner",
    "proposedBy",
    "personnelId"
  ]);

  if (depth > 8 || value === null || value === undefined) {
    return value ?? null;
  }

  if (typeof value === "string") {
    return redactPii(value).text;
  }

  if (typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(entry => anonymizeContext(entry, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !IDENTITY_KEYS.has(key))
      .map(([key, entry]) => [key, anonymizeContext(entry, depth + 1)])
  );
}
