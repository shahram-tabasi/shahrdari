/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import { randomUUID } from "node:crypto";

import projects from "../data/projects.js";

/**
 * Repository responsible for project data access.
 * The current implementation uses local demo data.
 * This layer can later be replaced with a database or external API
 * without changing services or controllers.
 */

let projectCollection = [...projects];

/**
 * Retrieve all projects.
 *
 * @returns {Promise<Array>}
 */
export async function findAll() {
  return projectCollection;
}

/**
 * Retrieve a project by its identifier.
 *
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function findById(id) {
  return projectCollection.find(project => String(project.id) === String(id)) ?? null;
}

/**
 * Insert a new project.
 *
 * @param {Object} project
 * @returns {Promise<Object>}
 */
export async function create(project) {
  const newProject = {
    id: randomUUID(),
    ...project
  };

  projectCollection.push(newProject);

  return newProject;
}

/**
 * Update an existing project.
 *
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object|null>}
 */
export async function update(id, updates) {
  const index = projectCollection.findIndex(
    project => String(project.id) === String(id)
  );

  if (index === -1) {
    return null;
  }

  projectCollection[index] = {
    ...projectCollection[index],
    ...updates,
    id: projectCollection[index].id
  };

  return projectCollection[index];
}

/**
 * Delete a project.
 *
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function remove(id) {
  const index = projectCollection.findIndex(
    project => String(project.id) === String(id)
  );

  if (index === -1) {
    return false;
  }

  projectCollection.splice(index, 1);

  return true;
}