import * as criteriaService from "../services/criteria.service.js";
import { successResponse } from "../utils/api-response.js";

/**
 * Retrieve all criteria.
 */
export async function getAllCriteria(req, res, next) {
  try {
    const criteria = await criteriaService.getAllCriteria();

    res.status(200).json(
      successResponse({
        message: "Criteria retrieved successfully.",
        data: criteria
      })
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve a criterion by its identifier.
 */
export async function getCriterionById(req, res, next) {
  try {
    const criterion = await criteriaService.getCriterionById(req.params.id);

    res.status(200).json(
      successResponse({
        message: "Criterion retrieved successfully.",
        data: criterion
      })
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Replace the entire criteria collection.
 */
export async function replaceCriteria(req, res, next) {
  try {
    const criteria = await criteriaService.replaceCriteria(req.body);

    res.status(200).json(
      successResponse({
        message: "Criteria collection replaced successfully.",
        data: criteria
      })
    );
  } catch (error) {
    next(error);
  }
}