import * as projectService from "../services/project.service.js";

/**
 * Get all projects.
 */
export async function getAllProjects(req, res, next) {
  try {
    const projects = await projectService.getAllProjects();

    res.status(200).json({
      success: true,
      message: "Projects retrieved successfully.",
      data: projects
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get project by identifier.
 */
export async function getProjectById(req, res, next) {
  try {
    const project = await projectService.getProjectById(req.params.id);

    res.status(200).json({
      success: true,
      message: "Project retrieved successfully.",
      data: project
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new project.
 */
export async function createProject(req, res, next) {
  try {
    const project = await projectService.createProject(req.body);

    res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: project
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing project.
 */
export async function updateProject(req, res, next) {
  try {
    const project = await projectService.updateProject(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: project
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a project.
 */
export async function deleteProject(req, res, next) {
  try {
    await projectService.deleteProject(req.params.id);

    res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
      data: null
    });
  } catch (error) {
    next(error);
  }
}