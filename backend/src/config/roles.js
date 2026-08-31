/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * ROLES AND PERMISSIONS — the security-management module of the directive.
 *
 * Access control is permission-based rather than role-based at the check site:
 * a route asks for the *permission* it needs, and roles are bundles of
 * permissions. That keeps horizontal and vertical privilege escalation
 * preventable,
 * because adding a role can never silently widen an existing route.
 *
 * The permission set mirrors what the directive separates: proposing a
 * project, approving criteria and weights, running the engines, and approving
 * an AI suggestion are four different authorities held by four different people.
 */

export const PERMISSION = Object.freeze({
  PROJECT_READ: "project:read",
  PROJECT_WRITE: "project:write",

  CRITERIA_READ: "criteria:read",
  /** Defining indicators, scales, directions and data sources — an official act. */
  CRITERIA_WRITE: "criteria:write",

  /** Running the ranking, portfolio and sensitivity engines. */
  DECISION_RUN: "decision:run",
  /** Committing a portfolio as the municipality's proposal. */
  DECISION_APPROVE: "decision:approve",

  /** Asking the language model for assistance. */
  AI_USE: "ai:use",
  /** Expert review: accepting or rejecting a model suggestion. */
  AI_REVIEW: "ai:review",

  REPORT_EXPORT: "report:export",
  AUDIT_READ: "audit:read",
  SYSTEM_ADMIN: "system:admin"
});

const ALL_PERMISSIONS = Object.values(PERMISSION);

/**
 * Role definitions. `viewer` is the least-privileged role and is what an
 * authenticated principal with no explicit role is given — never more.
 */
export const ROLES = Object.freeze({
  viewer: {
    label: "بیننده",
    permissions: [
      PERMISSION.PROJECT_READ,
      PERMISSION.CRITERIA_READ
    ]
  },
  proposer: {
    label: "پیشنهاددهنده پروژه",
    permissions: [
      PERMISSION.PROJECT_READ,
      PERMISSION.PROJECT_WRITE,
      PERMISSION.CRITERIA_READ
    ]
  },
  analyst: {
    label: "کارشناس برنامه‌ریزی",
    permissions: [
      PERMISSION.PROJECT_READ,
      PERMISSION.PROJECT_WRITE,
      PERMISSION.CRITERIA_READ,
      PERMISSION.DECISION_RUN,
      PERMISSION.AI_USE,
      PERMISSION.REPORT_EXPORT
    ]
  },
  expert: {
    label: "خبره ارزیاب",
    permissions: [
      PERMISSION.PROJECT_READ,
      PERMISSION.CRITERIA_READ,
      PERMISSION.CRITERIA_WRITE,
      PERMISSION.DECISION_RUN,
      PERMISSION.AI_USE,
      PERMISSION.AI_REVIEW,
      PERMISSION.REPORT_EXPORT
    ]
  },
  manager: {
    label: "مدیر تصمیم‌گیر",
    permissions: [
      PERMISSION.PROJECT_READ,
      PERMISSION.CRITERIA_READ,
      PERMISSION.DECISION_RUN,
      PERMISSION.DECISION_APPROVE,
      PERMISSION.AI_USE,
      PERMISSION.AI_REVIEW,
      PERMISSION.REPORT_EXPORT,
      PERMISSION.AUDIT_READ
    ]
  },
  auditor: {
    label: "ممیز",
    permissions: [
      PERMISSION.PROJECT_READ,
      PERMISSION.CRITERIA_READ,
      PERMISSION.AUDIT_READ,
      PERMISSION.REPORT_EXPORT
    ]
  },
  admin: {
    label: "مدیر سامانه",
    permissions: ALL_PERMISSIONS
  }
});

/**
 * The role assigned when a principal authenticates but claims no role.
 * Fail-secure: least privilege, never a permissive default.
 */
export const DEFAULT_ROLE = "viewer";

/**
 * Resolve the permission set for a role.
 *
 * An unknown role resolves to *no* permissions rather than to the default
 * role — a typo in a token must not grant access.
 *
 * @param {string} role
 * @returns {Set<string>}
 */
export function permissionsFor(role) {
  return new Set(ROLES[role]?.permissions ?? []);
}

/**
 * @param {string} role
 * @returns {boolean}
 */
export function isKnownRole(role) {
  return Object.hasOwn(ROLES, role);
}
