/**
 * تحلیل عدالت فضایی — the deprivation index and the regional-equity constraint.
 *
 * پیوست شماره دو lists ten indicators for the deprivation index and requires a
 * minimum share of the portfolio to reach the target districts. The index is
 * recomputed here from the raw indicators rather than read from a stored
 * scalar, so that a change in the underlying data actually moves the number and
 * the calculation can be re-derived during an audit.
 */

import { deprivationIndicators, equityConstraints } from "../data/policy.js";
import { minMaxNormalize, round } from "./normalize.js";

/**
 * Compute the deprivation index (0..1, higher = more deprived) for every
 * neighborhood, from the ten raw indicators.
 *
 * Indicators are min-max normalised across the set before weighting, so an
 * indicator recorded on a different practical range cannot dominate the index
 * purely through its units.
 *
 * @param {Array} neighborhoods
 * @param {Array} [indicators]
 * @returns {Array}
 */
export function computeDeprivationIndex(
  neighborhoods,
  indicators = deprivationIndicators
) {
  if (neighborhoods.length === 0) {
    return [];
  }

  const normalized = new Map();

  indicators.forEach(indicator => {
    const values = neighborhoods.map(
      neighborhood => neighborhood.indicators?.[indicator.key] ?? Number.NaN
    );
    const scaled = minMaxNormalize(values);

    // `provision` indicators run the other way: more provision, less deprivation.
    normalized.set(
      indicator.key,
      scaled.map(value =>
        indicator.direction === "provision" ? 1 - value : value
      )
    );
  });

  const weightTotal = indicators.reduce(
    (sum, indicator) => sum + indicator.weight,
    0
  );

  return neighborhoods.map((neighborhood, index) => {
    const components = indicators.map(indicator => ({
      key: indicator.key,
      label: indicator.label,
      contribution: round(
        (normalized.get(indicator.key)[index] * indicator.weight) / weightTotal,
        4
      )
    }));

    const score = components.reduce(
      (sum, component) => sum + component.contribution,
      0
    );

    const missing = indicators
      .filter(
        indicator => !Number.isFinite(neighborhood.indicators?.[indicator.key])
      )
      .map(indicator => indicator.key);

    return {
      ...neighborhood,
      deprivationIndex: round(score, 4),
      /** The stored legacy value, kept visible so drift is detectable. */
      storedDeprivation: neighborhood.deprivation ?? null,
      components,
      missingIndicators: missing
    };
  });
}

/**
 * Districts whose population-weighted deprivation index clears the threshold —
 * the «مناطق هدف» the minimum share must reach.
 *
 * @param {Array} scoredNeighborhoods
 * @param {number} [threshold]
 * @returns {Array}
 */
export function deprivedDistricts(
  scoredNeighborhoods,
  threshold = equityConstraints.deprivedThreshold
) {
  const byDistrict = new Map();

  scoredNeighborhoods.forEach(neighborhood => {
    const district = neighborhood.district ?? "نامشخص";
    const bucket = byDistrict.get(district) ?? {
      district,
      population: 0,
      weighted: 0,
      neighborhoods: []
    };

    const population = neighborhood.population ?? 0;

    bucket.population += population;
    bucket.weighted += neighborhood.deprivationIndex * population;
    bucket.neighborhoods.push(neighborhood.id);
    byDistrict.set(district, bucket);
  });

  return [...byDistrict.values()]
    .map(bucket => ({
      district: bucket.district,
      population: bucket.population,
      deprivationIndex: bucket.population > 0
        ? round(bucket.weighted / bucket.population, 4)
        : 0,
      neighborhoods: bucket.neighborhoods
    }))
    .map(entry => ({ ...entry, deprived: entry.deprivationIndex >= threshold }))
    .sort((left, right) => right.deprivationIndex - left.deprivationIndex);
}

/**
 * Evaluate a selected portfolio against the regional-equity constraint.
 *
 * @param {Array} selected
 * @param {Array} districts Result of `deprivedDistricts`.
 * @param {Object} [constraints]
 * @returns {Object}
 */
export function evaluateEquity(
  selected,
  districts,
  constraints = equityConstraints
) {
  const deprived = new Set(
    districts.filter(entry => entry.deprived).map(entry => entry.district)
  );

  const totalBudget = selected.reduce(
    (sum, project) => sum + (project.budget ?? 0),
    0
  );
  const deprivedBudget = selected
    .filter(project => deprived.has(project.district))
    .reduce((sum, project) => sum + (project.budget ?? 0), 0);

  const sharePercent = totalBudget > 0
    ? round((deprivedBudget / totalBudget) * 100, 2)
    : 0;

  const beneficiaries = selected.reduce(
    (sum, project) => sum + (project.beneficiaries ?? 0),
    0
  );
  const deprivedBeneficiaries = selected
    .filter(project => deprived.has(project.district))
    .reduce((sum, project) => sum + (project.beneficiaries ?? 0), 0);

  return {
    deprivedDistricts: [...deprived],
    threshold: constraints.deprivedThreshold,
    requiredSharePercent: constraints.minDeprivedSharePercent,
    actualSharePercent: sharePercent,
    satisfied: sharePercent >= constraints.minDeprivedSharePercent,
    deprivedBudget: round(deprivedBudget, 2),
    totalBudget: round(totalBudget, 2),
    beneficiaries,
    deprivedBeneficiaries,
    /** «کاهش شکاف برخورداری مناطق» expressed as a single 0..1 objective. */
    equityScore: beneficiaries > 0
      ? round(deprivedBeneficiaries / beneficiaries, 4)
      : 0
  };
}
