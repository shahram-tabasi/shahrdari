/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import app from "./app.js";
import env, { describe } from "./config/env.js";
import * as audit from "./services/audit.service.js";

/**
 * Start the HTTP server.
 *
 * The banner reports configuration *shape* via `describe()` and never a value,
 * so a secret cannot end up in a terminal scrollback, a CI log or a container
 * log aggregator.
 */
const server = app.listen(env.app.port, () => {
  /*
   * Express 5 invokes this callback even when the bind FAILED, with
   * `server.listening` still false; the 'error' event follows immediately
   * after. Printing the banner unconditionally therefore announces a healthy
   * start for a server that never came up — the operator sees the port, the
   * configuration and no error, and goes looking for the fault everywhere
   * except the one place it is. Print only once the socket is really open and
   * let the error handler below speak for the failure.
   */
  if (!server.listening) {
    return;
  }

  const configuration = describe();

  console.log(
    [
      "==================================================",
      ` ${env.app.name}`,
      ` Environment : ${configuration.environment}`,
      ` Port        : ${configuration.port}`,
      ` CORS origins: ${configuration.corsAllowedOrigins}`,
      ` Auth secret : ${configuration.authSecret}`,
      ` AI assistant: ${configuration.aiEnabled ? configuration.aiModel : "disabled (سامانه بدون مدل زبانی کار می‌کند)"}`,
      "=================================================="
    ].join("\n")
  );

  if (env.security.authSecretIsEphemeral) {
    console.warn(
      "AUTH_SECRET is not set. A per-restart ephemeral key is in use; all sessions are invalidated on restart. Set AUTH_SECRET before deploying."
    );
  }

  audit.record({
    category: audit.AUDIT_CATEGORY.SECURITY,
    action: "server.started",
    detail: configuration
  });
});

/**
 * Listen errors.
 *
 * Without this, a port that is already taken surfaces as a raw stack trace or,
 * under `node --watch`, as a bare "Completed running" line that looks like an
 * ordinary exit. Both leave the operator hunting for a problem the server
 * already knows the answer to, so name the port, name the cause, and name the
 * command that identifies the holder.
 */
server.on("error", error => {
  if (error.code === "EADDRINUSE") {
    console.error(
      [
        "",
        `Port ${env.app.port} is already in use, so this server did not start.`,
        "",
        "Another program owns it. These commands take no editing — run them as-is.",
        "",
        "  See what it is:",
        `    Windows (PowerShell) : Get-Process -Id (Get-NetTCPConnection -LocalPort ${env.app.port} -State Listen | Select-Object -ExpandProperty OwningProcess -Unique) | Format-List Id, ProcessName, Path`,
        `    macOS                : lsof -nP -iTCP:${env.app.port} -sTCP:LISTEN`,
        `    Linux                : ss -lntp | grep :${env.app.port}`,
        "",
        "  Stop it, once you are sure you do not need it:",
        `    Windows (PowerShell) : Stop-Process -Id (Get-NetTCPConnection -LocalPort ${env.app.port} -State Listen | Select-Object -ExpandProperty OwningProcess -Unique) -Force`,
        `    macOS / Linux        : kill $(lsof -t -iTCP:${env.app.port} -sTCP:LISTEN)`,
        "",
        "",
        "Or leave it alone and move this server: set PORT to a free port, then",
        "point the front end at it by updating the proxy target in",
        "front/vite.config.ts (or by setting VITE_API_BASE_URL for the dev server).",
        ""
      ].join("\n")
    );

    process.exit(1);
  }

  if (error.code === "EACCES") {
    console.error(
      `Port ${env.app.port} requires elevated privileges. Use a port above 1023.`
    );

    process.exit(1);
  }

  throw error;
});

/**
 * Graceful shutdown: stop accepting connections, let in-flight requests finish,
 * and seal the audit trail with a final record so a gap in the log is
 * distinguishable from a crash.
 *
 * @param {string} signal
 */
function shutdown(signal) {
  audit.record({
    category: audit.AUDIT_CATEGORY.SECURITY,
    action: "server.stopping",
    detail: { signal }
  });

  server.close(() => process.exit(0));

  // Do not hang forever on a stuck connection.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

/**
 * An unhandled rejection leaves the process in an unknown state. Record it and
 * exit rather than continuing to serve requests from a process that may be
 * holding half-applied state — fail-secure applies to the process too.
 */
process.on("unhandledRejection", reason => {
  console.error(
    JSON.stringify({
      level: "error",
      message: "Unhandled promise rejection; shutting down.",
      name: reason?.name ?? typeof reason
    })
  );

  audit.record({
    category: audit.AUDIT_CATEGORY.ERROR,
    action: "process.unhandledRejection",
    outcome: "failure",
    detail: { name: reason?.name ?? typeof reason }
  });

  shutdown("unhandledRejection");
});

export default server;
