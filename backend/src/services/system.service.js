/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import * as systemRepository from "../repositories/system.repository.js";
import HttpError from "../utils/http-error.js";

/**
 * Retrieve system configuration.
 *
 * @returns {Promise<Object>}
 */
export async function getSystemConfiguration() {
  const configuration = await systemRepository.find();

  if (!configuration) {
    throw new HttpError(404, "System configuration not found.");
  }

  return configuration;
}

/**
 * Update system configuration.
 *
 * @param {Object} configuration
 * @returns {Promise<Object>}
 */
export async function updateSystemConfiguration(configuration) {
  if (!configuration || typeof configuration !== "object") {
    throw new HttpError(
      400,
      "A valid system configuration object is required."
    );
  }

  return systemRepository.update(configuration);
}