export type ProjectCategory = string;

export type ProjectStatus = string;

/**
 * The eight preferential dimensions of the شیوه‌نامه, ranked 1..8 in the
 * document itself. These — not the thirty-seven leaf criteria — are the
 * weighting surface the expert panel adjusts.
 */
export type CriterionKey =
  | 'social'
  | 'financial'
  | 'environmental'
  | 'technical'
  | 'economic'
  | 'organizational'
  | 'risk'
  | 'competitive';

export type CriterionDirection = 'benefit' | 'cost';

/** طبقه‌بندی پروژه — heterogeneous classes are never ranked in one matrix. */
export type ProjectClass =
  | 'statutory'
  | 'inProgress'
  | 'newDevelopment'
  | 'maintenance'
  | 'revenue'
  | 'partnership'
  | 'emergency';

export interface Criterion {
  key: CriterionKey;
  code: string;
  /** The rank the شیوه‌نامه assigns this dimension (1 = most important). */
  rank: number;
  label: string;
  hint: string;
  weight: number;
  weightSource: string;
  direction: CriterionDirection;
}

/** One of the thirty-seven leaf criteria (T1…C2). */
export interface LeafCriterion {
  code: string;
  dimension: CriterionKey;
  label: string;
  hint: string;
  direction: CriterionDirection;
  localWeight: number;
  /** PROMETHEE indifference and preference thresholds. */
  q: number;
  p: number;
}

/** A binary gate of فیلتر شماره یک. */
export interface MandatoryCriterion {
  code: string;
  label: string;
  hint?: string;
  appliesTo: 'all' | 'megaProject';
}

export interface CriteriaModel {
  basis: string;
  weighting: { defaultMethod: string; note: string };
  dimensions: Criterion[];
  criteria: LeafCriterion[];
  mandatoryCriteria: MandatoryCriterion[];
  counts: { dimensions: number; preferential: number; mandatory: number };
}

export interface ProjectClassification {
  projectClass: ProjectClass;
  missionDomain: string;
  natureCategory: string;
  decisionUnit: string;
  megaProject: boolean;
  neighborhoodScale: boolean;
  lowImpact: boolean;
}

/** داده‌های لازم برای ارزیابی آینده‌نگر پروژه‌های نیمه‌تمام. */
export interface ProjectLifecycle {
  physicalProgressPercent: number;
  financialProgressPercent: number;
  costToComplete: number;
  monthsToComplete: number;
  contractualCommitments: number;
  terminationCost: number;
  potentialDamages: number;
  depreciationRisk: number;
  monthsToBenefit: number;
  realizableBenefits: number;
  phaseable: boolean;
  annualOperatingCost: number;
}

export interface ProjectFinance {
  cashFlow: Record<string, number>;
  futureCommitments: number;
  internalSharePercent: number;
  externalSharePercent: number;
  /** An earmarked fund is a partial source: `draw` is the amount taken. */
  earmarkedFund: { key: string; draw: number } | null;
}

export interface ProjectDependencies {
  requires: string[];
  conflictsWith: string[];
  group: string | null;
}

export interface ProjectReadiness {
  hasExecutivePlan: boolean;
  landAcquisitionComplete: boolean;
  permitsReady: boolean;
}

export interface Project {
  id: string;
  name: string;
  district: string;
  category: ProjectCategory;
  status: ProjectStatus;
  budget: number;
  score: number;
  justice: number;
  risk: number;
  deviation: number;
  progress: number;
  aiRecommended: boolean;
  beneficiaries: number;
  /** Dimension-level scores. */
  scores: Record<CriterionKey, number>;
  /** Criterion-level scores, keyed by leaf code. Sparse by design. */
  criterionScores?: Record<string, number>;
  classification: ProjectClassification;
  mandatory: Record<string, boolean>;
  lifecycle: ProjectLifecycle;
  finance: ProjectFinance;
  dependencies: ProjectDependencies;
  readiness: ProjectReadiness;
  lat: number;
  lng: number;
  explain: string;
}

export interface RankedProject extends Project {
  positiveFlow: number;
  negativeFlow: number;
  netFlow: number;
  finalScore: number | null;
  utility: number;
  rank: number | null;
  rankInClass?: number;
  projectClass?: ProjectClass;
  separateTrack?: boolean;
}

export interface Neighborhood {
  id: string;
  name: string;
  district: string;
  deprivation: number;
  projects: number;
  population: number;
  lat: number;
  lng: number;
  indicators: Record<string, number>;
  /** Recomputed from `indicators` by the equity engine. */
  deprivationIndex?: number;
  components?: Array<{ key: string; label: string; contribution: number }>;
}

export interface Scenario {
  id: string;
  name: string;
  budget: number;
  projects: number;
  coverage: number;
  justice: number;
}

export interface AuditEntry {
  id: string;
  actor: string;
  role: string;
  action: string;
  date: string;
  time: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  kind: 'ai' | 'budget' | 'system';
  unread: boolean;
}

export interface DecisionHistoryEntry {
  id: string;
  date: string;
  title: string;
  detail: string;
}

export interface SystemData {
  notifications: Notification[];
  auditTrail: AuditEntry[];
  savedScenarios: Scenario[];
  decisionHistory: DecisionHistoryEntry[];
}

export interface DashboardData {
  projects: Project[];
  criteria: Criterion[];
  neighborhoods: Neighborhood[];
  system: SystemData;
}

/* ── Session and access control ──────────────────────────────────────── */

export interface SessionInfo {
  token: string;
  expiresAt: string;
  role: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  role: string;
  roleLabel: string | null;
  districts: string[];
  permissions: string[];
  expiresAt: string;
}

/* ── Decision engine ─────────────────────────────────────────────────── */

/** An AHP pairwise comparison matrix on Saaty's 1/9..9 scale. */
export interface PairwiseInput {
  keys: CriterionKey[];
  matrix: number[][];
}

export interface WeightingResult {
  source: 'rank-order-centroid' | 'explicit' | 'ahp';
  dimensionWeights: Record<CriterionKey, number>;
  criterionWeights?: Record<string, number>;
  /** شاخص سازگاری — present only for AHP. */
  consistencyRatio: number | null;
  consistent: boolean;
  warnings: string[];
}

export interface ScreeningEntry {
  projectId: string;
  projectName: string;
  result: 'passed' | 'rejected';
  applicableCount: number;
  failed: Array<{ code: string; label: string }>;
  unanswered: Array<{ code: string; label: string }>;
  reason: string | null;
}

export interface ScreeningResult {
  passedCount: number;
  rejectedCount: number;
  report: ScreeningEntry[];
}

export interface DataQualityFinding {
  severity: 'blocking' | 'warning' | 'info';
  code: string;
  message: string;
}

export interface DataQualityReport {
  projectId: string;
  projectName: string;
  findings: DataQualityFinding[];
  blockingCount: number;
  warningCount: number;
  criterionCompletenessPercent: number;
  registrable: boolean;
}

export interface ContinuationAssessment {
  projectId: string;
  /** Reported for transparency; explicitly excluded from the decision. */
  sunkCostExcluded: number;
  forwardBenefit: number;
  forwardCost: number;
  terminationCost: number;
  netContinuationValue: number;
  netTerminationValue: number;
  benefitCostRatio: number | null;
  contractualCommitments: number;
  phaseable: boolean;
  recommendation: 'continue' | 'phase' | 'defer' | 'terminate';
  rationale: string;
}

export interface EvaluationResult {
  generatedAt: string;
  projectCount: number;
  model: {
    dimensions: Criterion[];
    criteriaCount: number;
    projectClasses: unknown[];
    planningHorizon: { baseYear: number; years: number[] };
  };
  screening: ScreeningResult;
  dataQuality: {
    reports: DataQualityReport[];
    summary: {
      total: number;
      registrable: number;
      blocking: number;
      warnings: number;
      averageCompletenessPercent: number;
    };
  };
  lifecycle: Array<{
    projectId: string;
    projectName: string;
    projectClass: ProjectClass | null;
    cost: { capital: number; operating: number; total: number; futureCommitments: number };
    continuation: ContinuationAssessment | null;
  }>;
  equity: { neighborhoods: Neighborhood[]; districts: DistrictEquity[] };
}

export interface RankingRequest {
  weights?: Partial<Record<CriterionKey, number>>;
  pairwise?: PairwiseInput;
  projectIds?: string[];
}

export interface RankingResult {
  generatedAt: string;
  weighting: WeightingResult;
  method: { ranking: string; preferenceFunction: string; note: string };
  screening: ScreeningResult;
  separateTrack: Array<{
    id: string;
    name: string;
    projectClass: ProjectClass;
    reason: string;
  }>;
  groups: Array<{
    projectClass: ProjectClass;
    projectClassLabel: string;
    treatment: string | null;
    ranking: RankedProject[];
  }>;
  projectCount: number;
  projects: RankedProject[];
  explanations: Array<{
    projectId: string;
    outranks: string;
    drivers: Array<{ code: string; label: string; contribution: number }>;
  }>;
}

export interface DistrictEquity {
  district: string;
  population: number;
  deprivationIndex: number;
  neighborhoods: string[];
  deprived: boolean;
}

export interface ConstraintViolation {
  family: 'financial' | 'dependency' | 'equity' | 'capacity' | 'policy';
  rule: string;
  message: string;
  /** How badly the rule is broken, as a fraction of the limit. */
  magnitude: number;
}

export interface PortfolioRequest {
  budget: number;
  weights?: Partial<Record<CriterionKey, number>>;
  pairwise?: PairwiseInput;
  includeProjectIds?: string[];
  excludeProjectIds?: string[];
  financial?: Record<string, unknown>;
  capacity?: Record<string, unknown>;
  policy?: Record<string, unknown>;
  equity?: Record<string, unknown>;
  seed?: number;
}

export interface PortfolioResult {
  generatedAt: string;
  /**
   * `proposed` — every constraint is satisfied and this can go forward.
   * `infeasible` — no compliant portfolio exists at this budget; the listed
   * projects are the least-violating combination and are a diagnostic, not a
   * recommendation.
   */
  status: 'proposed' | 'infeasible';
  budget: number;
  usedBudget: number;
  remainingBudget: number;
  utilizationPercent: number;
  portfolioCoveragePercent: number;
  projectCount: number;
  averageScore: number;
  averageRisk: number;
  weighting: WeightingResult;
  optimization: {
    method: string;
    seed: number;
    objectiveValue: number;
    objectiveBreakdown: Record<string, number>;
    feasible: boolean;
    violations: ConstraintViolation[];
    forcedProjects: string[];
    infeasibility: {
      minimumFeasibleBudget: number | null;
      message: string;
    } | null;
    note: string;
  };
  annualSpend: Record<string, number>;
  annualCaps: Record<string, number>;
  futureCommitments: number;
  equity: {
    deprivedDistricts: string[];
    threshold: number;
    requiredSharePercent: number;
    actualSharePercent: number;
    satisfied: boolean;
    deprivedBudget: number;
    totalBudget: number;
    beneficiaries: number;
    deprivedBeneficiaries: number;
    equityScore: number;
  };
  screening: ScreeningResult;
  projects: RankedProject[];
  rejected: Array<{
    id: string;
    name: string;
    rank: number | null;
    budget: number;
    reason: string;
  }>;
  neighborhoods: Neighborhood[];
}

/** Per-project outputs پیوست شماره دو requires from the sensitivity analysis. */
export interface ProjectSensitivity {
  projectId: string;
  projectName: string;
  inBaselinePortfolio: boolean;
  /** درصد سناریوهای انتخاب */
  selectionRatePercent: number;
  membershipStability: number;
  averageRank: number;
  rankRange: { best: number | null; worst: number | null; reversal: number };
  /** پروژه جایگزین */
  substitute: { projectId: string; projectName: string | null; frequency: number } | null;
  /** حداقل بودجه لازم برای ورود */
  minimumEntryBudget: number | null;
  /** حساسیت به تغییر وزن‌ها */
  weightSensitivity: number;
  /** حساسیت به آستانه‌های ترجیح */
  thresholdSensitivity: number;
  /** حساسیت به افزایش هزینه */
  costSensitivity: number;
}

export interface SensitivityResult {
  generatedAt: string;
  baseline: {
    projectIds: string[];
    objectiveValue: number;
    feasible: boolean;
    violations: ConstraintViolation[];
  };
  weighting: Pick<WeightingResult, 'source' | 'dimensionWeights' | 'consistencyRatio'>;
  sensitivity: {
    scenarios: number;
    seed: number;
    projects: ProjectSensitivity[];
    summary: { averageMembershipStability: number; maxRankReversal: number };
  };
  /** بررسی رتبه‌برگشتی */
  rankReversalTest: Array<{
    removedProjectId: string;
    removedProjectName: string;
    rankReversalDetected: boolean;
    affectedProjects: string[];
  }>;
  /** علت اصلی حذف یا انتخاب */
  selectionReasons: Array<{ projectId: string; inPortfolio: boolean; reason: string }>;
}

/* ── AI governance ───────────────────────────────────────────────────── */

export interface AiStatus {
  available: boolean;
  model: string | null;
  /** What still works when the language model is unavailable. */
  degradedMode: string | null;
  policy: {
    allowedTasks: Array<{
      key: string;
      label: string;
      requiresSource: boolean;
      outputIsSuggestion: boolean;
    }>;
    forbiddenActions: Array<{ code: string; label: string }>;
    humanInTheLoop: string;
  };
  tokenBudget: {
    used: number;
    budget: number;
    remaining: number | null;
    resetAt: string;
  } | null;
}

export interface AiSuggestion {
  suggestionId?: string;
  id?: string;
  task: string;
  taskLabel: string;
  output: string;
  model: string;
  processedAt: string;
  usage: { inputTokens: number | null; outputTokens: number | null; totalTokens: number | null } | null;
  contextScope?: string[];
  guardrailFindings: Array<{ code: string; severity: string; message: string }>;
  reviewStatus: 'pending' | 'accepted' | 'rejected';
  /** False until an authorised expert accepts the suggestion. */
  appliedToDecision: boolean;
  reviewedBy?: { id: string; name: string; role: string } | null;
  reviewedAt?: string | null;
  reviewReason?: string | null;
  revisions?: Array<{
    at: string;
    by: { id: string; name: string; role: string };
    previousOutput: string;
    newOutput: string;
    reason: string;
  }>;
  notice?: string;
}

export interface AuditEntryRecord {
  sequence: number;
  timestamp: string;
  category: string;
  action: string;
  outcome: 'success' | 'denied' | 'failure';
  requestId: string | null;
  actor: { id: string | null; role: string | null; name: string | null } | null;
  detail: Record<string, unknown>;
  previousHash: string;
  hash: string;
}
