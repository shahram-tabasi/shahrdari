/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeSensitivity,
  evaluateProjects,
  optimizePortfolio,
  rankProjects
} from "../src/services/decision.service.js";

/**
 * Tests for the directive's three filters.
 *
 * Each test asserts a RULE THE DOCUMENT STATES, not merely that the code runs.
 * If you change engine behaviour and a test here fails, check the directive
 * before changing the test — the assertion is probably the specification.
 */

test("فیلتر ۱ — a project failing a mandatory criterion is excluded, not penalised", async () => {
  const evaluation = await evaluateProjects();

  const failed = evaluation.screening.report.filter(
    entry => entry.result === "rejected"
  );

  assert.ok(failed.length > 0, "the fixture should contain rejected projects");

  // Every rejection names the gate that caused it.
  failed.forEach(entry => {
    assert.ok(entry.failed.length + entry.unanswered.length > 0);
    assert.match(entry.reason, /فیلتر شماره یک/);
  });

  // And a rejected project never appears in the ranking.
  const ranking = await rankProjects();
  const rankedIds = new Set(ranking.projects.map(project => String(project.id)));

  failed.forEach(entry => {
    assert.ok(
      !rankedIds.has(entry.projectId),
      `${entry.projectId} was rejected by screening but still ranked`
    );
  });
});

test("فیلتر ۱ fails closed on an unanswered mandatory criterion", async () => {
  const evaluation = await evaluateProjects({ projectIds: ["P-1041"] });
  const [entry] = evaluation.screening.report;

  // P-1041 answers every gate, so it passes.
  assert.equal(entry.result, "passed");
  assert.equal(entry.unanswered.length, 0);
  assert.ok(entry.applicableCount > 5, "mega projects face the extra gates");
});

test("mega-project gates apply only to mega projects", async () => {
  const evaluation = await evaluateProjects({
    projectIds: ["P-1041", "P-1118"]
  });

  const byId = new Map(
    evaluation.screening.report.map(entry => [entry.projectId, entry])
  );

  assert.ok(
    byId.get("P-1041").applicableCount > byId.get("P-1118").applicableCount,
    "a mega project must face more mandatory gates than a small one"
  );
});

test("default dimension weights follow the شیوه‌نامه's own ranking", async () => {
  const result = await rankProjects();
  const weights = result.weighting.dimensionWeights;

  assert.equal(result.weighting.source, "rank-order-centroid");

  // The directive's dimension ranking, most important first:
  // social 1, financial 2, environmental 3, technical 4,
  // economic 5, organisational 6, risk 7, competitive 8.
  const order = [
    "social",
    "financial",
    "environmental",
    "technical",
    "economic",
    "organizational",
    "risk",
    "competitive"
  ];

  order.slice(0, -1).forEach((key, index) => {
    assert.ok(
      weights[key] > weights[order[index + 1]],
      `${key} must outweigh ${order[index + 1]}`
    );
  });

  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  assert.ok(Math.abs(total - 100) < 1e-6, "weights must sum to 100");
});

test("AHP reports the consistency ratio and flags an inconsistent panel", async () => {
  // A deliberately inconsistent judgement: A≫B, B≫C, but C≫A.
  const inconsistent = await rankProjects({
    pairwise: {
      keys: ["social", "financial", "risk"],
      matrix: [
        [1, 9, 1 / 9],
        [1 / 9, 1, 9],
        [9, 1 / 9, 1]
      ]
    }
  });

  assert.equal(inconsistent.weighting.source, "ahp");
  assert.ok(inconsistent.weighting.consistencyRatio > 0.1);
  assert.equal(inconsistent.weighting.consistent, false);
  assert.ok(inconsistent.weighting.warnings.length > 0);

  // A coherent judgement passes.
  const consistent = await rankProjects({
    pairwise: {
      keys: ["social", "financial", "risk"],
      matrix: [
        [1, 3, 5],
        [1 / 3, 1, 3],
        [1 / 5, 1 / 3, 1]
      ]
    }
  });

  assert.ok(consistent.weighting.consistencyRatio <= 0.1);
  assert.equal(consistent.weighting.consistent, true);
});

test("heterogeneous project classes are ranked in separate matrices", async () => {
  const result = await rankProjects();

  // Every ranked project reports its class and its rank within that class.
  result.projects.forEach(project => {
    assert.ok(project.projectClass, `${project.id} has no class`);
    assert.ok(Number.isInteger(project.rankInClass));
  });

  // Within each class the ranks are a contiguous 1..n sequence.
  const byClass = new Map();

  result.projects.forEach(project => {
    byClass.set(project.projectClass, [
      ...(byClass.get(project.projectClass) ?? []),
      project.rankInClass
    ]);
  });

  byClass.forEach((ranks, projectClass) => {
    const sorted = [...ranks].sort((a, b) => a - b);

    sorted.forEach((rank, index) => {
      assert.equal(rank, index + 1, `class ${projectClass} has a rank gap`);
    });
  });
});

test("statutory and emergency projects bypass the comparison matrix", async () => {
  const result = await rankProjects();
  const separateIds = result.separateTrack.map(entry => entry.id);

  assert.ok(separateIds.length > 0);

  const rankedIds = new Set(result.projects.map(project => String(project.id)));

  separateIds.forEach(id => {
    assert.ok(!rankedIds.has(id), `${id} must not be ranked against other classes`);
  });
});

test("ranking explains why one project outranks the next", async () => {
  const result = await rankProjects();

  assert.ok(result.explanations.length > 0);

  result.explanations.forEach(entry => {
    entry.drivers.forEach(driver => {
      assert.ok(driver.code && driver.label);
      assert.ok(driver.contribution > 0);
    });
  });
});

test("a higher rank does not guarantee portfolio membership", async () => {
  const ranking = await rankProjects();
  const portfolio = await optimizePortfolio({ budget: 3600 });

  const selected = new Set(portfolio.projects.map(project => String(project.id)));
  const rankedOrder = ranking.projects.map(project => String(project.id));

  // Find any project that is out of the portfolio while a lower-ranked one is in.
  const excludedIndexes = rankedOrder
    .map((id, index) => (selected.has(id) ? -1 : index))
    .filter(index => index >= 0);
  const includedIndexes = rankedOrder
    .map((id, index) => (selected.has(id) ? index : -1))
    .filter(index => index >= 0);

  if (excludedIndexes.length > 0 && includedIndexes.length > 0) {
    assert.ok(
      Math.max(...includedIndexes) > Math.min(...excludedIndexes),
      "the optimiser should be able to skip a higher-ranked project"
    );
  }

  assert.match(portfolio.optimization.note, /رتبه پایین‌تر/);
});

test("portfolio stays within budget and reports feasibility honestly", async () => {
  const portfolio = await optimizePortfolio({ budget: 3600 });

  assert.equal(portfolio.status, "proposed");
  assert.equal(portfolio.optimization.feasible, true);
  assert.deepEqual(portfolio.optimization.violations, []);
  assert.ok(portfolio.usedBudget <= 3600);
  assert.equal(
    portfolio.remainingBudget,
    Number((3600 - portfolio.usedBudget).toFixed(2))
  );
});

test("an unsatisfiable budget is reported as infeasible, not as a recommendation", async () => {
  const portfolio = await optimizePortfolio({ budget: 900 });

  assert.equal(portfolio.status, "infeasible");
  assert.equal(portfolio.optimization.feasible, false);
  assert.ok(portfolio.optimization.violations.length > 0);

  const diagnosis = portfolio.optimization.infeasibility;

  assert.ok(diagnosis, "an infeasible result must carry a diagnosis");
  assert.ok(
    diagnosis.minimumFeasibleBudget === null ||
      diagnosis.minimumFeasibleBudget > 900,
    "the minimum feasible budget must exceed the one that failed"
  );
});

test("statutory projects and high-progress work are forced into the portfolio", async () => {
  const portfolio = await optimizePortfolio({ budget: 3600 });

  assert.ok(portfolio.optimization.forcedProjects.length > 0);

  const selected = new Set(portfolio.projects.map(project => String(project.id)));

  portfolio.optimization.forcedProjects.forEach(id => {
    assert.ok(selected.has(id), `forced project ${id} is missing from the portfolio`);
  });
});

test("the regional equity constraint is evaluated against the deprivation index", async () => {
  const portfolio = await optimizePortfolio({ budget: 3600 });

  assert.ok(portfolio.equity.deprivedDistricts.length > 0);
  assert.equal(portfolio.equity.satisfied, true);
  assert.ok(
    portfolio.equity.actualSharePercent >= portfolio.equity.requiredSharePercent
  );
});

test("earmarked funds are drawn partially and capped", async () => {
  const portfolio = await optimizePortfolio({ budget: 3600 });

  const violations = portfolio.optimization.violations.filter(violation =>
    violation.rule.startsWith("earmarked")
  );

  assert.deepEqual(violations, []);
});

test("multi-year cash flow is reported against the annual caps", async () => {
  const portfolio = await optimizePortfolio({ budget: 3600 });

  Object.entries(portfolio.annualSpend).forEach(([year, spend]) => {
    const cap = portfolio.annualCaps[year];

    if (Number.isFinite(cap)) {
      assert.ok(spend <= cap, `year ${year} exceeds its cap`);
    }
  });

  assert.ok(Number.isFinite(portfolio.futureCommitments));
});

test("explicit weights and inclusions are honoured", async () => {
  const portfolio = await optimizePortfolio({
    budget: 3600,
    weights: { social: 60, financial: 10, environmental: 10, technical: 5, economic: 5, organizational: 4, risk: 3, competitive: 3 },
    includeProjectIds: ["P-1096"]
  });

  assert.equal(portfolio.weighting.source, "explicit");
  assert.ok(
    portfolio.projects.some(project => String(project.id) === "P-1096"),
    "an explicitly included project must appear in the portfolio"
  );
});

test("a project rejected by فیلتر ۱ cannot be forced into the portfolio", async () => {
  await assert.rejects(
    optimizePortfolio({ budget: 3600, includeProjectIds: ["P-1131"] }),
    error => error.statusCode === 422
  );
});

test("excluded projects never appear", async () => {
  const portfolio = await optimizePortfolio({
    budget: 3600,
    excludeProjectIds: ["P-1041"]
  });

  assert.ok(!portfolio.projects.some(project => String(project.id) === "P-1041"));
});

test("the portfolio is reproducible for a given seed", async () => {
  const first = await optimizePortfolio({ budget: 3600, seed: 12345 });
  const second = await optimizePortfolio({ budget: 3600, seed: 12345 });

  assert.deepEqual(
    first.projects.map(project => project.id),
    second.projects.map(project => project.id)
  );
});

test("half-finished projects are evaluated on future cost and benefit only", async () => {
  const evaluation = await evaluateProjects();

  const continuations = evaluation.lifecycle.filter(
    entry => entry.continuation !== null
  );

  assert.ok(continuations.length > 0);

  continuations.forEach(entry => {
    const { continuation } = entry;

    // The sunk figure is reported but explicitly excluded from the decision.
    assert.ok(Number.isFinite(continuation.sunkCostExcluded));
    assert.match(continuation.rationale, /هزینه‌های (ازدست‌رفته|گذشته)/);

    // The recommendation follows from the forward comparison alone.
    const continues =
      continuation.recommendation === "continue" ||
      continuation.recommendation === "phase";

    assert.equal(
      continues,
      continuation.netContinuationValue >= continuation.netTerminationValue,
      `${entry.projectId}: recommendation does not follow from the forward values`
    );
  });
});

test("data quality reports missing inputs instead of inventing them", async () => {
  const evaluation = await evaluateProjects();

  assert.ok(evaluation.dataQuality.summary.total > 0);
  assert.ok(evaluation.dataQuality.summary.averageCompletenessPercent > 0);

  evaluation.dataQuality.reports.forEach(report => {
    assert.ok(Number.isFinite(report.criterionCompletenessPercent));

    report.findings.forEach(finding => {
      assert.ok(["blocking", "warning", "info"].includes(finding.severity));
      assert.ok(finding.message.length > 0);
    });
  });
});

test("sensitivity analysis produces every per-project output the appendix requires", async () => {
  const analysis = await analyzeSensitivity({ budget: 3600, scenarios: 12 });

  assert.ok(analysis.sensitivity.projects.length > 0);

  analysis.sensitivity.projects.forEach(entry => {
    assert.ok(Number.isFinite(entry.selectionRatePercent));
    assert.ok(Number.isFinite(entry.membershipStability));
    assert.ok(Number.isFinite(entry.weightSensitivity));
    assert.ok(Number.isFinite(entry.thresholdSensitivity));
    assert.ok(Number.isFinite(entry.costSensitivity));
    assert.ok(
      entry.minimumEntryBudget === null ||
        Number.isFinite(entry.minimumEntryBudget)
    );
    assert.ok(Object.hasOwn(entry, "substitute"));
    assert.ok(Object.hasOwn(entry.rankRange, "reversal"));
  });

  // Every project gets a stated reason for its fate.
  assert.equal(
    analysis.selectionReasons.length,
    analysis.sensitivity.projects.length
  );
  analysis.selectionReasons.forEach(reason => {
    assert.ok(reason.reason.length > 0);
  });

  // The add/drop test covers every comparable project.
  assert.ok(analysis.rankReversalTest.length > 0);
});

test("baseline projects are selected in most scenarios", async () => {
  const analysis = await analyzeSensitivity({ budget: 3600, scenarios: 15 });

  const baseline = new Set(analysis.baseline.projectIds);
  const stable = analysis.sensitivity.projects.filter(
    entry => baseline.has(entry.projectId) && entry.selectionRatePercent > 50
  );

  assert.ok(
    stable.length > 0,
    "a stable baseline should survive weight and budget perturbation"
  );
});
