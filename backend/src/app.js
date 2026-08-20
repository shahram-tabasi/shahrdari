import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import routes from "./routes/index.js";
import notFoundMiddleware from "./middleware/notFound.middleware.js";
import errorMiddleware from "./middleware/error.middleware.js";

const app = express();

/**
 * Security middleware.
 */
app.use(helmet());

/**
 * Enable CORS.
 */
app.use(cors());

/**
 * HTTP request logger.
 */
app.use(morgan("dev"));

/**
 * Parse JSON request bodies.
 */
app.use(
  express.json({
    limit: "10mb"
  })
);

/**
 * Parse URL encoded request bodies.
 */
app.use(
  express.urlencoded({
    extended: true
  })
);

/**
 * Health check endpoint.
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running.",
    data: {
      status: "UP"
    }
  });
});

/**
 * Register application routes.
 */
app.use("/api/v1", routes);

/**
 * Handle unknown routes.
 */
app.use(notFoundMiddleware);

/**
 * Global error handler.
 */
app.use(errorMiddleware);

export default app;