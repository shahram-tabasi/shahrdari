/**
 * Portfolio policy: the constraint families and formal objectives that
 * پیوست شماره دو of the شیوه‌نامه requires the system to model.
 *
 * These are *defaults*. Every value here is overridable per request through
 * `POST /decisions/portfolio`, which is how «تحلیل سناریو» (changing budget,
 * weights, costs and policies) is expressed in the API.
 */

/**
 * اهداف رسمی تصمیم. The شیوه‌نامه notes these objectives may conflict, so the
 * optimiser takes a weighted combination rather than a single objective and
 * reports each objective's contribution separately.
 */
export const objectives = [
  {
    key: "strategicValue",
    label: "بیشینه‌سازی ارزش راهبردی",
    direction: "maximize",
    weight: 30
  },
  {
    key: "beneficiaries",
    label: "بیشینه‌سازی جمعیت بهره‌مند",
    direction: "maximize",
    weight: 15
  },
  {
    key: "equityGap",
    label: "کاهش شکاف برخورداری مناطق",
    direction: "maximize",
    weight: 20
  },
  {
    key: "safetyRisk",
    label: "کاهش ریسک ایمنی",
    direction: "maximize",
    weight: 15
  },
  {
    key: "lifecycleCost",
    label: "کمینه‌سازی هزینه چرخه عمر",
    direction: "minimize",
    weight: 10
  },
  {
    key: "completionSpeed",
    label: "تسریع در تکمیل پروژه‌های اولویت‌دار",
    direction: "maximize",
    weight: 10
  }
];

/**
 * محدودیت‌های مالی.
 *
 * Budget figures are in میلیارد تومان, matching the project dataset.
 * `annualCaps` keys are Persian budget years.
 */
export const financialConstraints = {
  totalBudget: 3600,
  annualCaps: {
    1405: 3600,
    1406: 3200,
    1407: 2800
  },
  /** سقف تعهدات آتی — commitments this portfolio may push into later years. */
  futureCommitmentCap: 4200,
  /** بودجه هر معاونت یا منطقه. */
  districtCaps: {
    "منطقه ۱": 1200,
    "منطقه ۲": 1400,
    "منطقه ۳": 1100,
    "منطقه ۴": 1100
  },
  /** منابع مالی اختصاصی و بودجه‌های غیرقابل‌انتقال. */
  earmarkedFunds: [
    {
      key: "publicTransportFund",
      label: "اعتبار اختصاصی حمل‌ونقل عمومی",
      amount: 600,
      transferable: false,
      eligibleCategories: ["حمل‌ونقل"]
    },
    {
      key: "resilienceFund",
      label: "اعتبار اختصاصی تاب‌آوری و ایمنی",
      amount: 400,
      transferable: false,
      eligibleCategories: ["ایمنی", "زیرساخت"]
    }
  ],
  /** سهم منابع داخلی و خارجی. */
  fundingMix: {
    minExternalSharePercent: 15,
    maxInternalSharePercent: 90
  },
  /** حداقل و حداکثر سهم هر حوزه مأموریتی، بر حسب درصد بودجه سبد. */
  domainShares: {
    infrastructure: { min: 20, max: 55 },
    safety: { min: 10, max: 40 },
    environment: { min: 8, max: 35 },
    social: { min: 5, max: 30 }
  }
};

/**
 * محدودیت‌های ظرفیت اجرایی.
 */
export const capacityConstraints = {
  /** ظرفیت هم‌زمان اجرای پروژه‌ها. */
  maxConcurrentProjects: 10,
  /** ظرفیت نظارت شهرداری، بر حسب نفر-پروژه. */
  supervisionCapacity: 12,
  /** ظرفیت پیمانکاران واجد شرایط. */
  contractorCapacity: 11,
  /** پروژه‌هایی که تملک زمین آن‌ها تکمیل نشده، سقف مجزا دارند. */
  maxProjectsPendingLandAcquisition: 3,
  /** پروژه‌های فاقد آمادگی اسناد و مجوزها. */
  maxProjectsPendingPermits: 2
};

/**
 * محدودیت‌های سیاستی.
 */
export const policyConstraints = {
  /** حداقل سهم پروژه‌های امنیتی و ایمنی، درصد بودجه سبد. */
  minSafetySharePercent: 12,
  /** حداقل سهم حمل‌ونقل عمومی، درصد بودجه سبد. */
  minPublicTransportSharePercent: 10,
  /** حداقل تعداد پروژه‌های محله‌محور. */
  minNeighborhoodProjects: 2,
  /** سقف تعداد پروژه‌های فاقد طرح اجرایی. */
  maxProjectsWithoutExecutivePlan: 2,
  /**
   * الزام تکمیل پروژه‌های دارای پیشرفت بالا: هر پروژه نیمه‌تمام با پیشرفت
   * فیزیکی بیش از این آستانه، به‌صورت الزامی وارد سبد می‌شود.
   */
  mandatoryCompletionProgressThreshold: 70,
  /** سقف بودجه پروژه‌های نمایشی یا کم‌اثر، درصد بودجه سبد. */
  maxLowImpactSharePercent: 8
};

/**
 * عدالت منطقه‌ای — minimum share of the portfolio budget that must land in
 * districts whose deprivation index sits above `deprivedThreshold`.
 */
export const equityConstraints = {
  deprivedThreshold: 0.6,
  minDeprivedSharePercent: 25
};

/**
 * شاخص محرومیت — the ten indicators پیوست شماره دو proposes for the
 * deprivation index, with the direction each one pushes the index in.
 *
 * `direction: "deprivation"` means a higher raw value indicates *more*
 * deprivation (e.g. تراکم جمعیت, بافت فرسوده); `direction: "provision"` means a
 * higher raw value indicates *less* deprivation (e.g. سرانه فضای سبز).
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
 * افق زمانی برنامه‌ریزی سبد.
 */
export const planningHorizon = {
  baseYear: 1405,
  years: [1405, 1406, 1407],
  /** نرخ تعدیل و تورم سالانه، برای محاسبه هزینه چرخه عمر. */
  escalationRatePercent: 32,
  /** نرخ تنزیل برای ارزش فعلی منافع و هزینه‌ها. */
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
