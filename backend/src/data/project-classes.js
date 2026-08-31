/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * PROJECT CLASSIFICATION [طبقه‌بندی پروژه‌ها — پیوست شماره دو].
 *
 * The directive is explicit that wholly heterogeneous projects must not be
 * placed in a single comparison matrix without separating rules: comparing an
 * emergency structural retrofit against a beautification scheme in one matrix
 * produces a result that cannot be defended.
 *
 * So each class carries its own evaluation route, and the ranking engine builds
 * ONE COMPARISON MATRIX PER CLASS.
 *
 * `comparable: false` means the class bypasses ranking entirely and enters the
 * portfolio on its own track — it still consumes budget and still counts
 * towards policy minimums, but it gets no comparative rank.
 */

/**
 * How a class is treated once it reaches the prioritisation stage.
 *
 * - `mandatoryEntry`  — enters the portfolio on a separate track; not ranked
 *                       against the discretionary classes.
 * - `forwardLooking`  — evaluated on future cost and benefit only (see
 *                       `lifecycle` engine); sunk cost is explicitly excluded.
 * - `fullMcdm`        — the full multi-criteria evaluation.
 * - `assetRisk`       — failure-risk and life-cycle cost model.
 * - `financial`       — financial return and realisation-risk analysis.
 * - `fundingRisk`     — probability-of-financing analysis.
 * - `urgencyRules`    — independent urgency rules, outside the ranking.
 */
export const TREATMENT = Object.freeze({
  MANDATORY_ENTRY: "mandatoryEntry",
  FORWARD_LOOKING: "forwardLooking",
  FULL_MCDM: "fullMcdm",
  ASSET_RISK: "assetRisk",
  FINANCIAL: "financial",
  FUNDING_RISK: "fundingRisk",
  URGENCY_RULES: "urgencyRules"
});

const projectClasses = [
  {
    key: "statutory",
    label: "الزامی",
    example: "تکلیف قانونی یا رفع خطر فوری",
    treatment: TREATMENT.MANDATORY_ENTRY,
    comparable: false,
    description:
      "ورود اجباری یا مسیر مستقل؛ با سایر طبقات در یک ماتریس مقایسه نمی‌شود."
  },
  {
    key: "inProgress",
    label: "نیمه‌تمام",
    example: "پروژه دارای پیشرفت و تعهد قراردادی",
    treatment: TREATMENT.FORWARD_LOOKING,
    comparable: true,
    description:
      "ارزیابی هزینه و منفعت آتی؛ هزینه‌های گذشته امتیاز ترجیحی ایجاد نمی‌کند."
  },
  {
    key: "newDevelopment",
    label: "توسعه‌ای جدید",
    example: "ایجاد ظرفیت یا خدمت جدید",
    treatment: TREATMENT.FULL_MCDM,
    comparable: true,
    description: "ارزیابی کامل چندمعیاره."
  },
  {
    key: "maintenance",
    label: "نگهداشت",
    example: "حفظ سطح خدمت دارایی",
    treatment: TREATMENT.ASSET_RISK,
    comparable: true,
    description: "مدل ریسک خرابی و چرخه عمر."
  },
  {
    key: "revenue",
    label: "درآمدزا",
    example: "ایجاد درآمد مستقیم",
    treatment: TREATMENT.FINANCIAL,
    comparable: true,
    description: "تحلیل مالی و ریسک تحقق."
  },
  {
    key: "partnership",
    label: "مشارکتی",
    example: "وابسته به سرمایه‌گذار",
    treatment: TREATMENT.FUNDING_RISK,
    comparable: true,
    description: "ارزیابی احتمال تأمین مالی."
  },
  {
    key: "emergency",
    label: "اضطراری",
    example: "مدیریت بحران",
    treatment: TREATMENT.URGENCY_RULES,
    comparable: false,
    description: "قواعد فوریت مستقل، خارج از رتبه‌بندی عمومی."
  }
];

/**
 * Classes whose members bypass the comparison matrix and enter the portfolio
 * through their own track.
 */
export const nonComparableClasses = new Set(
  projectClasses
    .filter(projectClass => !projectClass.comparable)
    .map(projectClass => projectClass.key)
);

/**
 * @param {string} key
 * @returns {Object|null}
 */
export function findProjectClass(key) {
  return projectClasses.find(projectClass => projectClass.key === key) ?? null;
}

/**
 * DECISION UNITS [واحد تصمیم].
 *
 * The directive requires the system to state WHICH entity is being selected,
 * because selecting a whole programme is not the same as selecting one
 * executable phase of it. Recorded per project in
 * `classification.decisionUnit`.
 */
export const decisionUnits = [
  { key: "programme", label: "طرح کلان" },
  { key: "project", label: "پروژه مستقل" },
  { key: "phase", label: "فاز پروژه" },
  { key: "workPackage", label: "بسته کاری" },
  { key: "contract", label: "قرارداد" },
  { key: "budgetLine", label: "ردیف بودجه" }
];

export default projectClasses;
