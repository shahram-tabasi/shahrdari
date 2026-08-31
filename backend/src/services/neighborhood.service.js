/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import * as neighborhoodRepository from "../repositories/neighborhood.repository.js";
import HttpError from "../utils/http-error.js";

/**
 * Retrieve all neighborhoods.
 *
 * @returns {Promise<Array>}
 */
export async function getAllNeighborhoods() {
  return neighborhoodRepository.findAll();
}

/**
 * Retrieve a neighborhood by its identifier.
 *
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getNeighborhoodById(id) {
  const neighborhood = await neighborhoodRepository.findById(id);

  if (!neighborhood) {
    throw new HttpError(404, "Neighborhood not found.");
  }

  return neighborhood;
}

/**
 * Replace the entire neighborhood collection.
 *
 * @param {Array} collection
 * @returns {Promise<Array>}
 */
export async function replaceNeighborhoods(collection) {
  if (!Array.isArray(collection)) {
    throw new HttpError(
      400,
      "Neighborhood collection must be an array."
    );
  }

  return neighborhoodRepository.replace(collection);
}