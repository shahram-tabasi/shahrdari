/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * PORTFOLIO POLICY — CONSTRAINTS AND OBJECTIVES.
 *
 * These are the constraint families and formal decision objectives required by
 * Appendix 2 of the governing directive [پیوست شماره دو شیوه‌نامه].
 *
 * WHERE TO EDIT WHAT
 * ------------------
 * This file holds the *defaults*. Every value can be overridden per request
 * through `POST /api/v1/decisions/portfolio`, which is how scenario analysis
 * works — changing budgets, weights, costs and policies without redeploying.
 *
 * So:
 *   - Change a value HERE  → the new municipal baseline for every run.
 *   - Send it in a REQUEST → a one-off "what if" scenario, baseline untouched.
 *
 * UNITS: all money figures are in billion Toman (میلیارد تومان), matching the
 * project dataset. All "…Percent" fields are 0..100, not 0..1.
 * YEARS: keys are Persian calendar years (e.g. 1405).
 */

/**
 * FORMAL DECISION OBJECTIVES.
 *
 * The directive notes these objectives can conflict with one another, so the
 * optimiser maximises a weighted combination rather than a single objective,
 * and reports each objective's contribution separately in the response.
 *
 * `direction` says whether more of this is better (`maximize`) or worse
 * (`minimize`); the optimiser handles the inversion, so always record the raw
 * quantity and let the engine orient it.
 *
 * To retire an objective, set its weight to 0 rather than deleting the entry —
 * that keeps historical results comparable.
 */
export const objectives = [
  {
    key: "strategicValue",
    label: "بیشینه‌سازی ارزش راهبردی",
    labelEn: "Maximise strategic value",
    direction: "maximize",
    weight: 30
  },
  {
    key: "beneficiaries",
    label: "بیشینه‌سازی جمعیت بهره‌مند",
    labelEn: "Maximise beneficiary population",
    direction: "maximize",
    weight: 15
  },
  {
    key: "equityGap",
    label: "کاهش شکاف برخورداری مناطق",
    labelEn: "Reduce the inter-district provision gap",
    direction: "maximize",
    weight: 20
  },
  {
    key: "safetyRisk",
    label: "کاهش ریسک ایمنی",
    labelEn: "Reduce safety risk",
    direction: "maximize",
    weight: 15
  },
  {
    key: "lifecycleCost",
    label: "کمینه‌سازی هزینه چرخه عمر",
    labelEn: "Minimise life-cycle cost",
    direction: "minimize",
    weight: 10
  },
  {
    key: "completionSpeed",
    label: "تسریع در تکمیل پروژه‌های اولویت‌دار",
    labelEn: "Accelerate completion of priority projects",
    direction: "maximize",
    weight: 10
  }
];

/**
 * FINANCIAL CONSTRAINTS [محدودیت‌های مالی].
 *
 * A portfolio must satisfy ALL of these simultaneously. If you tighten one and
 * runs start coming back `status: "infeasible"`, that is the system telling you
 * the constraint set has no solution — check the reported
 * `minimumFeasibleBudget` before assuming it is a bug.
 */
export const financialConstraints = {
  /** Total ceiling for the whole portfolio. */
  totalBudget: 3600,

  /**
   * Per-year ceiling. Checked against each project's `finance.cashFlow`, not
   * against its total budget — a portfolio can fit the total cap and still
   * blow the year-one cap.
   */
  annualCaps: {
    1405: 3600,
    1406: 3200,
    1407: 2800
  },

  /**
   * Cap on commitments this portfolio pushes into later years
   * [سقف تعهدات آتی]. Without it you can select a portfolio that is affordable
   * in year one but leaves an uncoverable obligation behind — the exact failure
   * Appendix 2 warns about.
   */
  futureCommitmentCap: 4200,

  /** Per-district (or per-deputy) ceilings. Keys must match `project.district`. */
  districtCaps: {
    "منطقه ۱": 1200,
    "منطقه ۲": 1400,
    "منطقه ۳": 1100,
    "منطقه ۴": 1100
  },

  /**
   * Ring-fenced funds [منابع اختصاصی و بودجه‌های غیرقابل‌انتقال].
   *
   * A fund is a PARTIAL funding source: a project draws a stated amount from it
   * (`project.finance.earmarkedFund.draw`) and funds the rest elsewhere. The
   * cap applies to the sum of those draws, not to the budgets of the projects
   * touching the fund.
   *
   * `eligibleCategories` is what makes a fund non-transferable: only projects
   * in those categories may draw on it at all.
   */
  earmarkedFunds: [
    {
      key: "publicTransportFund",
      label: "اعتبار اختصاصی حمل‌ونقل عمومی",
      labelEn: "Ring-fenced public transport allocation",
      amount: 600,
      transferable: false,
      eligibleCategories: ["حمل‌ونقل"]
    },
    {
      key: "resilienceFund",
      label: "اعتبار اختصاصی تاب‌آوری و ایمنی",
      labelEn: "Ring-fenced resilience and safety allocation",
      amount: 400,
      transferable: false,
      eligibleCategories: ["ایمنی", "زیرساخت"]
    }
  ],

  /** Required mix of internal and external funding [سهم منابع داخلی و خارجی]. */
  fundingMix: {
    minExternalSharePercent: 15,
    maxInternalSharePercent: 90
  },

  /**
   * Minimum and maximum share of the portfolio budget per mission domain
   * [حداقل و حداکثر سهم هر حوزه]. Keys must match
   * `project.classification.missionDomain`. Omit a domain to leave it
   * unconstrained.
   */
  domainShares: {
    infrastructure: { min: 20, max: 55 },
    safety: { min: 10, max: 40 },
    environment: { min: 8, max: 35 },
    social: { min: 5, max: 30 }
  }
};

/**
 * DELIVERY CAPACITY CONSTRAINTS [محدودیت‌های ظرفیت اجرایی].
 *
 * These bound how much work the organisation can actually run at once, as
 * opposed to how much it can pay for. A portfolio that is affordable but
 * undeliverable is not a valid portfolio.
 */
export const capacityConstraints = {
  /** Maximum projects running concurrently. */
  maxConcurrentProjects: 10,
  /** Municipal supervision capacity, in project-slots. */
  supervisionCapacity: 12,
  /** Qualified contractor capacity. */
  contractorCapacity: 11,
  /** Projects whose land acquisition is still open carry their own cap. */
  maxProjectsPendingLandAcquisition: 3,
  /** Projects whose permits and documents are not yet ready. */
  maxProjectsPendingPermits: 2
};

/**
 * POLICY CONSTRAINTS [محدودیت‌های سیاستی].
 *
 * Council- and management-level rules that shape the portfolio's composition
 * regardless of what pure scoring would pick.
 */
export const policyConstraints = {
  /** Minimum share of portfolio budget going to safety/security projects. */
  minSafetySharePercent: 12,
  /** Minimum share going to public transport. */
  minPublicTransportSharePercent: 10,
  /** Minimum count of neighbourhood-scale projects. */
  minNeighborhoodProjects: 2,
  /** Maximum count of projects that have no executive plan yet. */
  maxProjectsWithoutExecutivePlan: 2,
  /**
   * Any in-progress project at or above this physical-progress percentage is
   * forced into the portfolio [الزام تکمیل پروژه‌های دارای پیشرفت بالا].
   */
  mandatoryCompletionProgressThreshold: 70,
  /** Cap on budget spent on showcase or low-impact projects. */
  maxLowImpactSharePercent: 8
};

/**
 * REGIONAL EQUITY CONSTRAINT [عدالت منطقه‌ای].
 *
 * `deprivedThreshold` (0..1) decides which districts count as target districts:
 * a district whose computed deprivation index reaches it is "deprived".
 * `minDeprivedSharePercent` is the minimum share of portfolio budget that must
 * land in those districts.
 *
 * Raising the threshold makes FEWER districts qualify, which usually makes the
 * share constraint harder to satisfy, not easier — the two interact, so change
 * them together and re-run.
 */
export const equityConstraints = {
  deprivedThreshold: 0.6,
  minDeprivedSharePercent: 25
};

/**
 * DEPRIVATION INDEX INPUTS [شاخص محرومیت].
 *
 * The ten indicators Appendix 2 proposes. The index is recomputed from these
 * raw values on every run — it is never read from a stored scalar — so editing
 * a weight here immediately changes which districts qualify as deprived.
 *
 * `direction` tells the engine which way the indicator points:
 *   - "deprivation" — a HIGHER raw value means MORE deprived
 *                     (worn-out fabric, density, safety risk).
 *   - "provision"   — a HIGHER raw value means LESS deprived
 *                     (income, green space, service access).
 *
 * Record raw values as they are measured, on a 0..100 scale. Never pre-invert a
 * "provision" indicator in the data; the engine does that, and doing it twice
 * silently flips the meaning of the whole index.
 */
export const deprivationIndicators = [
  { key: "householdIncome", label: "درآمد و وضعیت اقتصادی خانوار", direction: "provision", weight: 14 },
  { key: "publicTransportAccess", label: "دسترسی به حمل‌ونقل عمومی", direction: "provision", weight: 11 },
  { key: "greenSpacePerCapita", label: "سرانه فضای سبز", direction: "provision", weight: 9 },
  { key: "urbanServiceAccess", label: "دسترسی به خدمات شهری", direction: "provision", weight: 12 },
  { key: "roadQuality", label: "کیفیت معابر", direction: "provision", weight: 9 },
  { key: "wornOutFabric", label: "بافت فرسوده", direction: "deprivation", weight: 11 },
  { key: "populationDensity", label: "تراکم جمعیت", direction: "deprivation", weight: 8 },
  { key: "safetyRisk", label: "ریسک ایمنی و بحران", direction: "deprivation", weight: 12 },
  { key: "socialVulnerability", label: "آسیب‌پذیری فرهنگی و اجتماعی", direction: "deprivation", weight: 8 },
  { key: "distanceToCoreServices", label: "فاصله زمانی تا خدمات اصلی", direction: "deprivation", weight: 6 }
];

/**
 * PLANNING HORIZON [افق زمانی برنامه‌ریزی].
 *
 * Urban projects are multi-year, so the model has to price money by the year it
 * is actually spent and benefits by the year they actually arrive.
 *
 * - `escalationRatePercent` inflates a nominal cost forward to the year it is
 *   incurred. Without it, a portfolio that looks affordable in the base year
 *   quietly becomes unaffordable by year three.
 * - `discountRatePercent` brings future benefits and costs back to present
 *   value, so a benefit five years out is not counted as if it arrived today.
 *
 * Update these annually from the municipality's approved figures.
 */
export const planningHorizon = {
  baseYear: 1405,
  years: [1405, 1406, 1407],
  escalationRatePercent: 32,
  discountRatePercent: 20
};

export default {
  objectives,
  financialConstraints,
  capacityConstraints,
  policyConstraints,
  equityConstraints,
  deprivationIndicators,
  planningHorizon
};
