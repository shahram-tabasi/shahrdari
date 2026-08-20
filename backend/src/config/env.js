import dotenv from "dotenv";

dotenv.config();

/**
 * Application environment configuration.
 * This module is the single source of truth for environment variables.
 */

const requiredVariables = ["OPENAI_API_KEY"];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

const env = {
  app: {
    name: "Municipality Decision Support System",
    environment: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 3000)
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || "gpt-5"
  }
};

export default env;