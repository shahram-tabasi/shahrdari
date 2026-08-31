import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import env from "../config/env.js";

/**
 * الگ‌گذاری متمرکز و غیرقابل تغییر — «این الگ‌ها باید در برابر حذف یا دستکاری
 * محافظت شوند».
 *
 * A single process cannot make a local file truly immutable — that is the job
 * of the central log sink (WORM storage, an append-only collector) this service
 * is meant to feed. What it *can* do, and does, is make tampering detectable:
 * every record carries the hash of the record before it, so altering or
 * removing any entry breaks the chain from that point onward and `verify()`
 * reports exactly where.
 *
 * The record shape covers the audit trail the security document requires of an
 * AI system: چه کسی پرسید؟ چه چیزی پرسید؟ مدل چه پاسخی داد؟ چه ابزاری فراخوانی
 * شد؟ چه داده‌ای بازیابی شد؟ چه اقدامی انجام شد؟
 */

const GENESIS = "0".repeat(64);

/**
 * Categories, so a downstream collector can route and retain by kind.
 */
export const AUDIT_CATEGORY = Object.freeze({
  AUTH: "auth",
  ACCESS: "access",
  DECISION: "decision",
  AI_REQUEST: "ai.request",
  AI_RESPONSE: "ai.response",
  AI_REVIEW: "ai.review",
  SECURITY: "security",
  ERROR: "error"
});

let chainHead = GENESIS;
let sequence = 0;

/** In-memory mirror, so the API can serve the trail without reading the file. */
const buffer = [];
const BUFFER_LIMIT = 2000;

let logStream = null;
let logPath = null;

/**
 * Fields that must never reach the log, whatever nesting they arrive at.
 * Redaction happens on the way in, not on the way out, so a secret is never
 * written to disk in the first place.
 */
const REDACTED_KEYS = new Set([
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "apiKey",
  "api_key",
  "secret",
  "authSecret",
  "cookie",
  "setCookie"
]);

/**
 * Deep-clone a value, replacing sensitive fields and truncating long strings.
 *
 * @param {*} value
 * @param {number} [depth]
 * @returns {*}
 */
function sanitize(value, depth = 0) {
  if (depth > 6) {
    return "[truncated: depth]";
  }

  if (value === null || value === undefined) {
    return value ?? null;
  }

  if (typeof value === "string") {
    return value.length > 4000 ? `${value.slice(0, 4000)}…[truncated]` : value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 200).map(entry => sanitize(entry, depth + 1));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        REDACTED_KEYS.has(key) ? "[redacted]" : sanitize(entry, depth + 1)
      ])
    );
  }

  return String(value);
}

/**
 * Open the append-only log file. Failure to open is logged once and the service
 * continues with the in-memory chain: losing the disk sink must not take the
 * application down, but it must not pass unnoticed either.
 */
function ensureStream() {
  if (logStream !== null) {
    return logStream;
  }

  try {
    const directory = path.resolve(env.security.auditLogDir);

    fs.mkdirSync(directory, { recursive: true, mode: 0o750 });

    logPath = path.join(
      directory,
      `audit-${new Date().toISOString().slice(0, 10)}.log`
    );

    logStream = fs.createWriteStream(logPath, {
      flags: "a",
      mode: 0o640
    });

    logStream.on("error", error => {
      console.error(
        JSON.stringify({
          level: "error",
          message: "Audit log stream failed; continuing with in-memory chain.",
          reason: error.code ?? error.name
        })
      );
      logStream = null;
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Audit log could not be opened; continuing with in-memory chain.",
        reason: error.code ?? error.name
      })
    );
    logStream = false;
  }

  return logStream;
}

/**
 * Append one record to the audit chain.
 *
 * @param {Object} entry
 * @param {string} entry.category One of `AUDIT_CATEGORY`.
 * @param {string} entry.action What happened.
 * @param {Object} [entry.actor] `{ id, role, name }` — چه کسی؟
 * @param {string} [entry.requestId] Correlation id.
 * @param {string} [entry.outcome] `success` | `denied` | `failure`.
 * @param {Object} [entry.detail] Anything else worth keeping.
 * @returns {Object} The sealed record.
 */
export function record(entry) {
  sequence += 1;

  const body = {
    sequence,
    timestamp: new Date().toISOString(),
    category: entry.category,
    action: entry.action,
    outcome: entry.outcome ?? "success",
    requestId: entry.requestId ?? null,
    actor: entry.actor
      ? {
          id: entry.actor.id ?? null,
          role: entry.actor.role ?? null,
          name: entry.actor.name ?? null
        }
      : null,
    detail: sanitize(entry.detail ?? {}),
    previousHash: chainHead
  };

  const hash = crypto
    .createHmac("sha256", env.security.authSecret)
    .update(JSON.stringify(body))
    .digest("hex");

  const sealed = { ...body, hash };

  chainHead = hash;

  buffer.push(sealed);

  if (buffer.length > BUFFER_LIMIT) {
    buffer.shift();
  }

  const stream = ensureStream();

  if (stream) {
    stream.write(`${JSON.stringify(sealed)}\n`);
  }

  return sealed;
}

/**
 * Verify the in-memory chain.
 *
 * @returns {{ valid: boolean, checked: number, brokenAtSequence: number|null }}
 */
export function verify() {
  let previousHash = buffer.length > 0 ? buffer[0].previousHash : GENESIS;

  for (const entry of buffer) {
    const { hash, ...body } = entry;

    if (body.previousHash !== previousHash) {
      return { valid: false, checked: buffer.length, brokenAtSequence: body.sequence };
    }

    const expected = crypto
      .createHmac("sha256", env.security.authSecret)
      .update(JSON.stringify(body))
      .digest("hex");

    if (expected !== hash) {
      return { valid: false, checked: buffer.length, brokenAtSequence: body.sequence };
    }

    previousHash = hash;
  }

  return { valid: true, checked: buffer.length, brokenAtSequence: null };
}

/**
 * Read back the recent trail.
 *
 * @param {Object} [options]
 * @returns {Array}
 */
export function list({ limit = 100, category = null } = {}) {
  const filtered = category
    ? buffer.filter(entry => entry.category === category)
    : buffer;

  return filtered.slice(-limit).reverse();
}

/**
 * @returns {Object}
 */
export function status() {
  return {
    entries: buffer.length,
    sequence,
    head: chainHead,
    sink: logPath,
    sinkAvailable: Boolean(logStream),
    integrity: verify()
  };
}
