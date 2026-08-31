/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import * as criteriaService from "./criteria.service.js";
import * as neighborhoodService from "./neighborhood.service.js";
import * as projectService from "./project.service.js";
import * as systemService from "./system.service.js";

/**
 * Retrieve the complete dashboard view model.
 *
 * @returns {Promise<Object>}
 */
export async function getDashboard() {
  const [projects, criteria, neighborhoods, system] = await Promise.all([
    projectService.getAllProjects(),
    criteriaService.getAllCriteria(),
    neighborhoodService.getAllNeighborhoods(),
    systemService.getSystemConfiguration()
  ]);

  return {
    projects: structuredClone(projects),
    criteria: structuredClone(criteria),
    neighborhoods: structuredClone(neighborhoods),
    system: structuredClone(system)
  };
}
