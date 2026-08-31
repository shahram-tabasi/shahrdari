/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import crypto from "node:crypto";

import env from "../config/env.js";
import {
  DEFAULT_ROLE,
  isKnownRole,
  permissionsFor
} from "../config/roles.js";
import * as audit from "../services/audit.service.js";
import { AUDIT_CATEGORY } from "../services/audit.service.js";
import HttpError from "../utils/http-error.js";

/**
 * AUTHENTICATION AND ACCESS CONTROL.
 *
 * The token format here is a signed, expiring bearer token that carries the
 * principal's identity and role. It is deliberately a thin, self-contained
 * implementation with a clear seam: `verifyToken` is the only place that
 * decides who a caller is, so swapping it for the municipality's OAuth 2.0 /
 * OIDC provider is a single-function change and every route keeps working.
 *
 * The two rules that must survive that swap:
 *
 *   1. Fail-secure. Anything unexpected — no token, bad signature, expired,
 *      unknown role — denies access. There is no "assume viewer" path, no
 *      development bypass that could reach production.
 *   2. Deny by default. `authenticate` establishes identity, it does not grant
 *      anything; every protected route must name the permission it needs.
 */

const TOKEN_VERSION = "v1";

/**
 * Constant-time string comparison, so a signature check cannot be turned into
 * a byte-by-byte oracle by timing it.
 *
 * @param {string} left
 * @param {string} right
 * @returns {boolean}
 */
function timingSafeEqual(left, right) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

/**
 * @param {string} payload
 * @returns {string}
 */
function sign(payload) {
  return crypto
    .createHmac("sha256", env.security.authSecret)
    .update(payload)
    .digest("base64url");
}

/**
 * Issue a session token.
 *
 * @param {Object} principal
 * @param {string} principal.id
 * @param {string} principal.name
 * @param {string} principal.role
 * @param {string[]} [principal.districts] ABAC scope — the districts this
 *   principal may act on. Empty means "all districts".
 * @returns {{ token: string, expiresAt: string }}
 */
export function issueToken({ id, name, role, districts = [] }) {
  if (!isKnownRole(role)) {
    throw new HttpError(400, "Unknown role.");
  }

  const expiresAt = Date.now() + env.security.sessionTtlMinutes * 60_000;

  const claims = {
    v: TOKEN_VERSION,
    sub: id,
    name,
    role,
    districts,
    exp: expiresAt,
    // A nonce keeps two tokens issued in the same millisecond distinct.
    jti: crypto.randomBytes(12).toString("base64url")
  };

  const payload = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");

  return {
    token: `${payload}.${sign(payload)}`,
    expiresAt: new Date(expiresAt).toISOString()
  };
}

/**
 * Verify a session token and return its principal.
 *
 * @param {string} token
 * @returns {Object}
 * @throws {HttpError} 401 for anything that is not a valid, current token.
 */
export function verifyToken(token) {
  const invalid = () => new HttpError(401, "احراز هویت انجام نشد.");

  if (typeof token !== "string" || token.length === 0 || token.length > 4096) {
    throw invalid();
  }

  const separator = token.lastIndexOf(".");

  if (separator <= 0) {
    throw invalid();
  }

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  if (!timingSafeEqual(sign(payload), signature)) {
    throw invalid();
  }

  let claims;

  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw invalid();
  }

  if (claims.v !== TOKEN_VERSION) {
    throw invalid();
  }

  // Enforce the session time limit.
  if (!Number.isFinite(claims.exp) || claims.exp <= Date.now()) {
    throw new HttpError(401, "نشست منقضی شده است؛ دوباره وارد شوید.");
  }

  // An unknown role resolves to no permissions, so a tampered or stale role
  // name cannot be used to reach anything.
  if (!isKnownRole(claims.role)) {
    throw invalid();
  }

  return {
    id: claims.sub,
    name: claims.name,
    role: claims.role,
    districts: Array.isArray(claims.districts) ? claims.districts : [],
    permissions: permissionsFor(claims.role),
    expiresAt: new Date(claims.exp).toISOString()
  };
}

/**
 * Establish the caller's identity. Does not authorise anything on its own.
 *
 * @returns {import("express").RequestHandler}
 */
export function authenticate() {
  return (req, res, next) => {
    const header = req.get("authorization") ?? "";
    const [scheme, token] = header.split(" ");

    if (!/^Bearer$/i.test(scheme ?? "") || !token) {
      audit.record({
        category: AUDIT_CATEGORY.AUTH,
        action: "authenticate",
        outcome: "denied",
        requestId: req.id,
        detail: { path: req.path, reason: "missing-bearer-token" }
      });

      return next(new HttpError(401, "احراز هویت انجام نشد."));
    }

    try {
      req.principal = verifyToken(token);

      audit.record({
        category: AUDIT_CATEGORY.AUTH,
        action: "authenticate",
        outcome: "success",
        requestId: req.id,
        actor: req.principal,
        detail: { path: req.path }
      });

      return next();
    } catch (error) {
      audit.record({
        category: AUDIT_CATEGORY.AUTH,
        action: "authenticate",
        outcome: "denied",
        requestId: req.id,
        detail: { path: req.path, reason: "invalid-token" }
      });

      return next(error);
    }
  };
}

/**
 * Require a permission. Deny is the default and the only fallback.
 *
 * @param {...string} required
 * @returns {import("express").RequestHandler}
 */
export function authorize(...required) {
  return (req, res, next) => {
    const principal = req.principal;

    if (!principal) {
      // authorize() before authenticate() is a wiring mistake; deny rather
      // than let the route run unprotected.
      return next(new HttpError(401, "احراز هویت انجام نشد."));
    }

    const granted = required.every(permission =>
      principal.permissions.has(permission)
    );

    if (!granted) {
      audit.record({
        category: AUDIT_CATEGORY.ACCESS,
        action: "authorize",
        outcome: "denied",
        requestId: req.id,
        actor: principal,
        detail: { path: req.path, required }
      });

      // Deliberately does not say which permission was missing: that is a map
      // of the authorisation model handed to an unauthorised caller.
      return next(new HttpError(403, "دسترسی لازم برای این عملیات را ندارید."));
    }

    return next();
  };
}

/**
 * ABAC — restrict a principal to the districts they are scoped to.
 *
 * This is the horizontal-privilege check: a district analyst authorised to run
 * the decision engine must not be able to run it over another district's
 * projects simply because the permission is the same.
 *
 * @param {(req: import("express").Request) => string[]} extractDistricts
 * @returns {import("express").RequestHandler}
 */
export function authorizeDistricts(extractDistricts) {
  return (req, res, next) => {
    const principal = req.principal;

    if (!principal) {
      return next(new HttpError(401, "احراز هویت انجام نشد."));
    }

    // An empty scope means municipality-wide authority.
    if (principal.districts.length === 0) {
      return next();
    }

    const requested = extractDistricts(req) ?? [];
    const allowed = new Set(principal.districts);
    const outOfScope = requested.filter(district => !allowed.has(district));

    if (outOfScope.length > 0) {
      audit.record({
        category: AUDIT_CATEGORY.ACCESS,
        action: "authorizeDistricts",
        outcome: "denied",
        requestId: req.id,
        actor: principal,
        detail: { path: req.path, outOfScope }
      });

      return next(new HttpError(403, "دسترسی به مناطق درخواستی را ندارید."));
    }

    return next();
  };
}

export default authenticate;
