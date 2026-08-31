/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import projects from "../data/projects.js";
import criteria from "../data/criteria.js";
import neighborhoods from "../data/neighborhoods.js";
import system from "../data/system.js";

/**
 * Repository responsible for dashboard data aggregation.
 * All data currently comes from local demo files.
 * This layer can later be replaced with database queries.
 */

/**
 * Retrieve all dashboard source data.
 *
 * @returns {Promise<Object>}
 */
export async function getDashboardData() {
  return {
    projects: structuredClone(projects),
    criteria: structuredClone(criteria),
    neighborhoods: structuredClone(neighborhoods),
    system: structuredClone(system)
  };
}