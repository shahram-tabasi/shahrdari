/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import * as projectRepository from "../repositories/project.repository.js";

/**
 * Retrieve all projects.
 *
 * @returns {Promise<Array>}
 */
export async function getAllProjects() {
  return projectRepository.findAll();
}

/**
 * Retrieve a single project.
 *
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getProjectById(id) {
  const project = await projectRepository.findById(id);

  if (!project) {
    const error = new Error("Project not found.");
    error.statusCode = 404;
    throw error;
  }

  return project;
}

/**
 * Create a project.
 *
 * @param {Object} project
 * @returns {Promise<Object>}
 */
export async function createProject(project) {
  return projectRepository.create(project);
}

/**
 * Update a project.
 *
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateProject(id, updates) {
  const project = await projectRepository.update(id, updates);

  if (!project) {
    const error = new Error("Project not found.");
    error.statusCode = 404;
    throw error;
  }

  return project;
}

/**
 * Delete a project.
 *
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteProject(id) {
  const deleted = await projectRepository.remove(id);

  if (!deleted) {
    const error = new Error("Project not found.");
    error.statusCode = 404;
    throw error;
  }
}