import crypto from "node:crypto";

/**
 * Attach a correlation id to every request.
 *
 * «مسیر حسابرسی» requires an AI answer, the request that produced it, the
 * expert who later approved it and the error it may have raised to be tied
 * together. A per-request id is what makes that possible without correlating
 * on timestamps.
 *
 * The id is echoed to the client so a user reporting a problem can quote it,
 * and it is the *only* internal detail an error response is allowed to carry.
 *
 * @returns {import("express").RequestHandler}
 */
export default function requestContext() {
  return (req, res, next) => {
    // An inbound id is accepted for tracing across services, but only if it
    // looks like an id — otherwise a caller controls a value that ends up in
    // logs and response headers.
    const inbound = req.get("x-request-id");

    req.id = /^[A-Za-z0-9_-]{8,64}$/.test(inbound ?? "")
      ? inbound
      : crypto.randomUUID();

    req.startedAt = process.hrtime.bigint();

    res.setHeader("X-Request-Id", req.id);

    next();
  };
}
