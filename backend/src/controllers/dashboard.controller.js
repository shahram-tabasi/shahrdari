/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import * as dashboardService from "../services/dashboard.service.js";
import { successResponse } from "../utils/api-response.js";

/**
 * Retrieve dashboard data.
 */
export async function getDashboard(req, res, next) {
  try {
    const dashboard = await dashboardService.getDashboard();

    res.status(200).json(
      successResponse({
        message: "Dashboard data retrieved successfully.",
        data: dashboard
      })
    );
  } catch (error) {
    next(error);
  }
}