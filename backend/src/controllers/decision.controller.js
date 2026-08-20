import * as decisionService from "../services/decision.service.js";
import { successResponse } from "../utils/api-response.js";

export async function getScenarios(req, res, next) {
  try {
    const scenarios = await decisionService.getScenarios();

    res.status(200).json(successResponse({
      message: "Decision scenarios retrieved successfully.",
      data: scenarios
    }));
  } catch (error) {
    next(error);
  }
}

export async function createRanking(req, res, next) {
  try {
    const ranking = await decisionService.rankProjects(req.body);

    res.status(200).json(successResponse({
      message: "Projects ranked successfully.",
      data: ranking
    }));
  } catch (error) {
    next(error);
  }
}

export async function optimizePortfolio(req, res, next) {
  try {
    const portfolio = await decisionService.optimizePortfolio(req.body);

    res.status(200).json(successResponse({
      message: "Portfolio optimized successfully.",
      data: portfolio
    }));
  } catch (error) {
    next(error);
  }
}
