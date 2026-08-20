import * as neighborhoodService from "../services/neighborhood.service.js";
import { successResponse } from "../utils/api-response.js";

/**
 * Retrieve all neighborhoods.
 */
export async function getAllNeighborhoods(req, res, next) {
  try {
    const neighborhoods = await neighborhoodService.getAllNeighborhoods();

    res.status(200).json(
      successResponse({
        message: "Neighborhoods retrieved successfully.",
        data: neighborhoods
      })
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve a neighborhood by its identifier.
 */
export async function getNeighborhoodById(req, res, next) {
  try {
    const neighborhood = await neighborhoodService.getNeighborhoodById(
      req.params.id
    );

    res.status(200).json(
      successResponse({
        message: "Neighborhood retrieved successfully.",
        data: neighborhood
      })
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Replace the entire neighborhood collection.
 */
export async function replaceNeighborhoods(req, res, next) {
  try {
    const neighborhoods =
      await neighborhoodService.replaceNeighborhoods(req.body);

    res.status(200).json(
      successResponse({
        message: "Neighborhood collection replaced successfully.",
        data: neighborhoods
      })
    );
  } catch (error) {
    next(error);
  }
}