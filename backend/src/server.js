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
