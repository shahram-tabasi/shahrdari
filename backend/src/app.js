/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import env from "./config/env.js";
import errorMiddleware from "./middleware/error.middleware.js";
import notFoundMiddleware from "./middleware/notFound.middleware.js";
import rateLimit from "./middleware/rate-limit.middleware.js";
import requestContext from "./middleware/request-context.middleware.js";
import routes from "./routes/index.js";
import * as audit from "./services/audit.service.js";
import HttpError from "./utils/http-error.js";

const app = express();

/**
 * Trust exactly one reverse proxy hop. `trust proxy` must never be left at
 * `true`: with an unbounded chain, a client can forge `X-Forwarded-For` and
 * defeat every IP-keyed rate limit and audit entry.
 */
app.set("trust proxy", 1);
app.disable("x-powered-by");

/**
 * Correlation id — first, so every later middleware including the error
 * handler can reference it.
 */
app.use(requestContext());

/**
 * Security headers.
 *
 * The API serves JSON only, so the CSP is locked to nothing: there is no
 * legitimate script, style or frame to load from an API response, and a strict
 * policy means a reflected payload cannot execute even if one ever escaped
 * encoding. `frame-ancestors 'none'` blocks clickjacking against any HTML the
 * service might ever return.
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        "default-src": ["'none'"],
        "frame-ancestors": ["'none'"],
        "base-uri": ["'none'"],
        "form-action": ["'none'"]
      }
    },
    crossOriginResourcePolicy: { policy: "same-site" },
    referrerPolicy: { policy: "no-referrer" },
    hsts: env.app.isProduction
      ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
      : false
  })
);

/**
 * CORS against an explicit allowlist.
 *
 * The previous `cors()` with no arguments reflected any origin and is the
 * opposite of zero trust: it lets any site a municipal employee visits call
 * this API with their session. Unknown origins are rejected here.
 *
 * Requests with no `Origin` header (server-to-server, curl, health probes) are
 * allowed through, because CORS is a browser control and blocking them would
 * break non-browser clients without protecting anyone.
 */
const allowedOrigins = new Set(env.security.corsAllowedOrigins);

/**
 * Loopback origins, allowed in DEVELOPMENT ONLY and on any port.
 *
 * Widening the CORS_ALLOWED_ORIGINS default is not enough on its own: a
 * developer whose `.env` predates that change keeps the two origins their file
 * lists, and Vite moves to 5174 or beyond whenever 5173 is taken. The result is
 * a browser that is refused by the API for a reason that has nothing to do with
 * the application.
 *
 * Only loopback hosts match, and only when NODE_ENV is not production, so this
 * cannot widen a deployed environment: an attacker's page is served from a real
 * hostname and never matches. Production continues to accept nothing beyond its
 * explicit allowlist.
 */
const LOOPBACK_ORIGIN = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/;

function isAllowedOrigin(origin) {
  if (allowedOrigins.has(origin)) {
    return true;
  }

  return !env.app.isProduction && LOOPBACK_ORIGIN.test(origin);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      audit.record({
        category: audit.AUDIT_CATEGORY.SECURITY,
        action: "cors.rejected",
        outcome: "denied",
        detail: { origin }
      });

      return callback(new HttpError(403, "این مبدأ مجاز نیست."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id", "RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"],
    maxAge: 600
  })
);

/**
 * Request logging, correlated by request id and without query strings — a URL
 * can carry an identifier or a filter that belongs in the audit log, not in a
 * line-oriented access log.
 */
morgan.token("id", req => req.id ?? "-");

app.use(
  morgan(
    env.app.isProduction
      ? ':id :method :url :status :response-time ms'
      : "dev",
    {
      skip: req => req.path === "/health"
    }
  )
);

/**
 * Body parsing.
 *
 * The limit is 256kb by default, not the previous 10mb: nothing this API
 * accepts is large, and a generous limit is free memory pressure for an
 * attacker, and the standard requires bounding oversized and repeated requests.
 */
app.use(express.json({ limit: env.app.jsonBodyLimit, strict: true }));
app.use(
  express.urlencoded({
    extended: false,
    limit: env.app.jsonBodyLimit,
    parameterLimit: 50
  })
);

/**
 * Baseline rate limit across the whole API. Individual routers add tighter
 * limits of their own.
 */
app.use(rateLimit({ name: "api" }));

/**
 * Liveness probe. Reports that the process is up and nothing else — an
 * unauthenticated endpoint must not disclose configuration or dependency
 * state.
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running.",
    data: { status: "UP" },
    errors: null,
    meta: null
  });
});

app.use("/api/v1", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
