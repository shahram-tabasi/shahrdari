/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import crypto from "node:crypto";

import dotenv from "dotenv";
import { z } from "zod";

import { company, product } from "./branding.js";

dotenv.config();

/**
 * Application configuration — the single source of truth for environment.
 *
 * SECURITY POSTURE (from the secure-coding standard):
 *
 * - SECRETS: no secret is ever hardcoded here or committed. Every secret
 *   is read from the environment at run time, which is where a secrets manager
 *   (Vault, Key Vault, Kubernetes Secrets) injects it. The parsed values are
 *   never logged, and `describe()` below exists so that startup diagnostics can
 *   report configuration without printing any of it.
 *
 * - FAIL SECURE: production requires its secrets to be present and
 *   refuses to start without them, rather than silently falling back to a
 *   development default. Development is allowed a generated ephemeral key so a
 *   contributor can run the app, and it says so loudly.
 *
 * - The AI key is deliberately OPTIONAL. The directive requires the system to
 *   state how it keeps operating while the language-model service is down.
 *   The decision engine is the product; the language model is an assistant.
 *   A missing or broken AI key degrades the AI endpoints, it does not take the
 *   municipality's portfolio system offline.
 */

const booleanFromEnv = z
  .string()
  .trim()
  .toLowerCase()
  .transform(value => value === "true" || value === "1" || value === "yes");

const csv = z
  .string()
  .transform(value =>
    value
      .split(",")
      .map(entry => entry.trim())
      .filter(Boolean)
  );

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  /*
   * Comma-separated allowlist of browser origins. There is no wildcard.
   *
   * The default covers the ports Vite actually uses in development: it starts
   * at 5173 and increments when that port is already taken, which is why a
   * developer with another project running ends up on 5174 or 5175. Production
   * MUST set this variable explicitly to the real front-end origin — these
   * localhost entries are then irrelevant, because a browser never sends
   * `http://localhost:5173` as the Origin of a production page.
   */
  CORS_ALLOWED_ORIGINS: csv.default(
    [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "http://127.0.0.1:5175",
      "http://127.0.0.1:5176"
    ].join(",")
  ),

  /** HMAC key for session tokens and for sealing the audit chain. */
  AUTH_SECRET: z.string().min(32).optional(),
  SESSION_TTL_MINUTES: z.coerce.number().int().min(1).max(720).default(60),

  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().min(1).default(60),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).default(120),
  AI_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().min(1).default(300),
  AI_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).default(15),
  AI_MAX_INPUT_CHARACTERS: z.coerce.number().int().min(1).default(8000),
  AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(1).default(2000),
  AI_DAILY_TOKEN_BUDGET: z.coerce.number().int().min(0).default(200000),

  /** Body size limit. Deliberately far below the previous 10mb. */
  JSON_BODY_LIMIT: z.string().default("256kb"),

  /*
   * Language-model connection.
   *
   * Vendor-neutral names (LLM_*) are preferred. The legacy OPENAI_* names are
   * still accepted so an existing .env keeps working — see the merge step
   * below. Set LLM_BASE_URL to an internally hosted, OpenAI-compatible
   * endpoint to keep all data inside the municipal network.
   */
  LLM_API_KEY: z.string().min(1).optional(),
  LLM_MODEL: z.string().optional(),
  LLM_BASE_URL: z.string().url().optional(),

  /* Deprecated aliases, kept for backward compatibility. */
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional(),

  /**
   * Whether municipality documents may leave the network for a third-party
   * model. Defaults to false. The data-governance rules require an explicit
   * to state explicitly whether documents are sent to an external service, and
   * the safe default is that they are not.
   */
  AI_ALLOW_EXTERNAL_DOCUMENTS: booleanFromEnv.default("false"),

  /** Directory the tamper-evident audit log is written to. */
  AUDIT_LOG_DIR: z.string().default("./var/audit")
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Report which variables are wrong, never their values.
  const issues = parsed.error.issues
    .map(issue => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration — ${issues}`);
}

const raw = parsed.data;
const isProduction = raw.NODE_ENV === "production";

/*
 * Resolve the language-model settings, preferring the vendor-neutral names and
 * falling back to the legacy ones so existing deployments keep working.
 */
const llmApiKey = raw.LLM_API_KEY ?? raw.OPENAI_API_KEY ?? null;
const llmModel = raw.LLM_MODEL ?? raw.OPENAI_MODEL ?? "gpt-4o-mini";
const llmBaseUrl = raw.LLM_BASE_URL ?? raw.OPENAI_BASE_URL ?? null;

if (isProduction && !raw.AUTH_SECRET) {
  throw new Error(
    "AUTH_SECRET is required in production. Inject it from the secrets manager; the application will not start with a generated key."
  );
}

/**
 * In development only, an ephemeral key keeps the app runnable without
 * weakening production. It changes on every restart, so it can never become an
 * accidental long-lived shared secret.
 */
const authSecret =
  raw.AUTH_SECRET ?? crypto.randomBytes(48).toString("base64url");

const env = Object.freeze({
  app: {
    // Names come from `config/branding.js` — edit them there, not here.
    name: product.fullFa,
    nameEn: product.fullEn,
    vendor: company.fa,
    environment: raw.NODE_ENV,
    isProduction,
    port: raw.PORT,
    jsonBodyLimit: raw.JSON_BODY_LIMIT
  },

  security: {
    corsAllowedOrigins: raw.CORS_ALLOWED_ORIGINS,
    authSecret,
    authSecretIsEphemeral: !raw.AUTH_SECRET,
    sessionTtlMinutes: raw.SESSION_TTL_MINUTES,
    rateLimit: {
      windowSeconds: raw.RATE_LIMIT_WINDOW_SECONDS,
      maxRequests: raw.RATE_LIMIT_MAX_REQUESTS
    },
    auditLogDir: raw.AUDIT_LOG_DIR
  },

  ai: {
    /** Fail-closed: no key means the assistant features are simply unavailable. */
    enabled: Boolean(llmApiKey),
    apiKey: llmApiKey,
    model: llmModel,
    baseUrl: llmBaseUrl,
    allowExternalDocuments: raw.AI_ALLOW_EXTERNAL_DOCUMENTS,
    maxInputCharacters: raw.AI_MAX_INPUT_CHARACTERS,
    maxOutputTokens: raw.AI_MAX_OUTPUT_TOKENS,
    dailyTokenBudget: raw.AI_DAILY_TOKEN_BUDGET,
    rateLimit: {
      windowSeconds: raw.AI_RATE_LIMIT_WINDOW_SECONDS,
      maxRequests: raw.AI_RATE_LIMIT_MAX_REQUESTS
    }
  }
});

/**
 * A log-safe view of the configuration: presence and shape, never values.
 *
 * @returns {Object}
 */
export function describe() {
  return {
    environment: env.app.environment,
    port: env.app.port,
    corsAllowedOrigins: env.security.corsAllowedOrigins.length,
    authSecret: env.security.authSecretIsEphemeral ? "ephemeral (dev)" : "configured",
    aiEnabled: env.ai.enabled,
    aiModel: env.ai.enabled ? env.ai.model : null,
    aiAllowExternalDocuments: env.ai.allowExternalDocuments
  };
}

export default env;
