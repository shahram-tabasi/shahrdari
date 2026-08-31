/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import * as systemService from "../services/system.service.js";
import { successResponse } from "../utils/api-response.js";

/**
 * Retrieve system configuration.
 */
export async function getSystemConfiguration(req, res, next) {
  try {
    const configuration = await systemService.getSystemConfiguration();

    res.status(200).json(
      successResponse({
        message: "System configuration retrieved successfully.",
        data: configuration
      })
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Update system configuration.
 */
export async function updateSystemConfiguration(req, res, next) {
  try {
    const configuration = await systemService.updateSystemConfiguration(
      req.body
    );

    res.status(200).json(
      successResponse({
        message: "System configuration updated successfully.",
        data: configuration
      })
    );
  } catch (error) {
    next(error);
  }
}