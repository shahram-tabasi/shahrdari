import app from "./app.js";
import env from "./config/env.js";

/**
 * Start HTTP server.
 */
app.listen(env.app.port, () => {
  console.log(`
==================================================
 ${env.app.name}
 Environment : ${env.app.environment}
 Port        : ${env.app.port}
==================================================
`);
});