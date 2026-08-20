import assert from "node:assert/strict";
import test from "node:test";

import {
  optimizePortfolio,
  rankProjects
} from "../src/services/decision.service.js";

test("rankProjects returns a stable descending weighted ranking", async () => {
  const result = await rankProjects();

  assert.equal(result.projectCount, 12);
  assert.equal(result.projects[0].rank, 1);

  for (let index = 1; index < result.projects.length; index += 1) {
    assert.ok(
      result.projects[index - 1].finalScore >= result.projects[index].finalScore
    );
  }
});

test("rankProjects supports a requested project subset", async () => {
  const result = await rankProjects({ projectIds: ["P-1041", "P-1052"] });

  assert.equal(result.projectCount, 2);
  assert.deepEqual(
    new Set(result.projects.map(project => project.id)),
    new Set(["P-1041", "P-1052"])
  );
});

test("optimizePortfolio stays within budget and honors exclusions", async () => {
  const result = await optimizePortfolio({
    budget: 2200,
    excludeProjectIds: ["P-1041"]
  });

  assert.ok(result.usedBudget <= 2200);
  assert.ok(!result.projects.some(project => project.id === "P-1041"));
  assert.equal(result.remainingBudget, 2200 - result.usedBudget);
});

test("optimizePortfolio rejects mandatory projects above budget", async () => {
  await assert.rejects(
    optimizePortfolio({
      budget: 100,
      includeProjectIds: ["P-1041"]
    }),
    error => error.statusCode === 422
  );
});
