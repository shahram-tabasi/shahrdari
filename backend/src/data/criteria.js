/**
 * Criteria model of the "شناسایی، انتخاب، اولویت‌بندی و تعریف سبد پروژه" شیوه‌نامه
 * (ویرایش پنجم، ذیل نظام جامع مدیریت پروژه شهرداری کرمان).
 *
 * The شیوه‌نامه splits the decision criteria into two families:
 *
 *   1. معیارهای الزامی (mandatory) — binary gates. A project failing any one of
 *      them is dropped at «فیلتر شماره یک» and never enters the comparison
 *      matrix. See `mandatoryCriteria` below.
 *
 *   2. معیارهای ترجیحی (preferential) — graded criteria, grouped into eight
 *      dimensions (ابعاد) that the شیوه‌نامه itself ranks 1..8. See
 *      `dimensions` and `criteria` below.
 *
 * Dimension weights are NOT hardcoded: they are derived from the rank the
 * شیوه‌نامه assigns to each dimension using the Rank-Order Centroid (ROC)
 * method, so the numbers stay auditable and traceable back to the document.
 * An expert panel may override them through the weighting engine (AHP), in
 * which case the consistency ratio is recorded alongside.
 */

/**
 * Direction of a criterion.
 *
 * - `benefit` — a higher raw value is better.
 * - `cost`    — a higher raw value is worse (e.g. risk, هزینه, بدهی).
 */
export const DIRECTION = Object.freeze({
  BENEFIT: "benefit",
  COST: "cost"
});

/**
 * The eight preferential dimensions, with the rank («رتبه بعد») the
 * شیوه‌نامه assigns to each of them.
 */
const dimensionDefinitions = [
  {
    key: "social",
    code: "S",
    rank: 1,
    label: "اجتماعی",
    hint: "سلامت، ایمنی، خواسته مردم، عدالت فضایی و مشارکت"
  },
  {
    key: "financial",
    code: "F",
    rank: 2,
    label: "مالی",
    hint: "هزینه، تأمین مالی، تهاتر، بدهی و هزینه نگهداری"
  },
  {
    key: "environmental",
    code: "E",
    rank: 3,
    label: "زیست‌محیطی",
    hint: "کاهش آلاینده‌های هوا، آب، منابع زیرزمینی و صوتی"
  },
  {
    key: "technical",
    code: "T",
    rank: 4,
    label: "فنی",
    hint: "توجیه‌پذیری، دانش، تجهیزات، افق زمانی و پیشرفت پروژه"
  },
  {
    key: "economic",
    code: "EC",
    rank: 5,
    label: "اقتصادی",
    hint: "نسبت فایده به هزینه و سودآوری پروژه"
  },
  {
    key: "organizational",
    code: "O",
    rank: 6,
    label: "سازمانی (سیاسی)",
    hint: "همراستایی با مأموریت، اسناد بالادستی و نگرش مدیران"
  },
  {
    key: "risk",
    code: "R",
    rank: 7,
    label: "ریسک",
    hint: "ریسک پروژه، ریسک سازمانی و ریسک محیطی"
  },
  {
    key: "competitive",
    code: "C",
    rank: 8,
    label: "رقابتی",
    hint: "رقابت‌پذیری شهری، جذب سرمایه‌گذاری و اشتغال"
  }
];

/**
 * Rank-Order Centroid weights.
 *
 * For a set of `n` ranked items, the ROC weight of the item at rank `i` is
 * `w(i) = (1 / n) * Σ(j = i .. n) 1 / j`. It is the centroid of the simplex of
 * all weight vectors consistent with the stated ordering, which makes it the
 * defensible default when the شیوه‌نامه states an order but not the magnitudes.
 *
 * @param {number} count
 * @returns {number[]} Weights in rank order, summing to 1.
 */
export function rankOrderCentroidWeights(count) {
  if (!Number.isInteger(count) || count <= 0) {
    throw new RangeError("Rank-order centroid requires a positive item count.");
  }

  return Array.from({ length: count }, (unused, index) => {
    let sum = 0;

    for (let rank = index + 1; rank <= count; rank += 1) {
      sum += 1 / rank;
    }

    return sum / count;
  });
}

const rocWeights = rankOrderCentroidWeights(dimensionDefinitions.length);

/**
 * The eight preferential dimensions with their derived default weights,
 * expressed on a 0..100 scale so that the whole set sums to 100.
 */
export const dimensions = dimensionDefinitions
  .slice()
  .sort((left, right) => left.rank - right.rank)
  .map((dimension, index) => ({
    ...dimension,
    weight: Number((rocWeights[index] * 100).toFixed(4)),
    weightSource: "rank-order-centroid",
    direction: DIRECTION.BENEFIT
  }));

/**
 * Preferential criteria («معیارهای ترجیحی»), verbatim from the شیوه‌نامه.
 *
 * `direction` marks whether the raw score is a benefit or a cost. Note that
 * the risk dimension and the cost-like financial criteria are modelled as
 * genuine cost criteria rather than being pre-inverted in the data, so that
 * the normalisation step — not the data entry clerk — owns the inversion.
 *
 * `q` (indifference) and `p` (preference) are the PROMETHEE thresholds on the
 * normalised 0..100 scale. They express «آستانه ترجیح» and are exposed to the
 * sensitivity engine («تحلیل حساسیت آستانه‌ها»).
 */
export const criteria = [
  // ─── بعد فنی (Technical) ────────────────────────────────────────────────
  {
    code: "T1",
    dimension: "technical",
    label: "توجیه‌پذیر بودن پروژه",
    hint: "توجیه فنی، اقتصادی، مالی، اجتماعی-فرهنگی، زیست‌محیطی و پدافند غیرعامل",
    direction: DIRECTION.BENEFIT,
    localWeight: 14,
    q: 5,
    p: 30
  },
  {
    code: "T2",
    dimension: "technical",
    label: "میزان دانش، تجربه و مهارت مرتبط (نرم‌افزار)",
    hint: "کارایی نیروی انسانی داخل و خارج سازمان",
    direction: DIRECTION.BENEFIT,
    localWeight: 8,
    q: 5,
    p: 30
  },
  {
    code: "T3",
    dimension: "technical",
    label: "میزان دسترسی به تجهیزات و امکانات (سخت‌افزار)",
    hint: "تجهیزات و ماشین‌آلات موردنیاز در سازمان یا خارج از آن",
    direction: DIRECTION.BENEFIT,
    localWeight: 8,
    q: 5,
    p: 30
  },
  {
    code: "T4",
    dimension: "technical",
    label: "مدت زمان انجام پروژه (افق زمانی)",
    hint: "طول راه‌اندازی کوتاه‌تر و بازدهی سریع‌تر ارجح است",
    direction: DIRECTION.COST,
    localWeight: 9,
    q: 5,
    p: 30
  },
  {
    code: "T5",
    dimension: "technical",
    label: "میزان عمر مفید پروژه",
    hint: "عمر مفید بیشتر، هزینه نگهداری کمتر",
    direction: DIRECTION.BENEFIT,
    localWeight: 8,
    q: 5,
    p: 30
  },
  {
    code: "T6",
    dimension: "technical",
    label: "میزان پیشرفت پروژه (شاخص‌های SPI و CPI)",
    hint: "پروژه‌های با پیشرفت فیزیکی بیشتر در اولویت اتمام قرار می‌گیرند",
    direction: DIRECTION.BENEFIT,
    localWeight: 10,
    q: 5,
    p: 30
  },
  {
    code: "T7",
    dimension: "technical",
    label: "درجه شفافیت و سادگی پروژه",
    hint: "سادگی طراحی و اجرا، ریسک و عدم قطعیت کمتر",
    direction: DIRECTION.BENEFIT,
    localWeight: 7,
    q: 5,
    p: 30
  },
  {
    code: "T8",
    dimension: "technical",
    label: "مقیاس عملکرد پروژه",
    hint: "وسعت حوزه خدمت‌رسانی: فراشهری، شهری، منطقه، ناحیه یا محله",
    direction: DIRECTION.BENEFIT,
    localWeight: 9,
    q: 5,
    p: 30
  },
  {
    code: "T9",
    dimension: "technical",
    label: "میزان شباهت با پروژه‌های پیشین",
    hint: "آشنایی قبلی ریسک را کاهش و ضریب اطمینان را افزایش می‌دهد",
    direction: DIRECTION.BENEFIT,
    localWeight: 6,
    q: 5,
    p: 30
  },
  {
    code: "T10",
    dimension: "technical",
    label: "میزان انعطاف‌پذیری زمانی پروژه",
    hint: "تبعات به تعویق افتادن پروژه؛ انعطاف کمتر یعنی فوریت بیشتر",
    direction: DIRECTION.COST,
    localWeight: 8,
    q: 5,
    p: 30
  },
  {
    code: "T11",
    dimension: "technical",
    label: "تضمین موفقیت سایر پروژه‌ها",
    hint: "پیش‌نیاز، هم‌نیاز یا تکمیل‌کننده بودن برای پروژه‌های نیمه‌تمام",
    direction: DIRECTION.BENEFIT,
    localWeight: 7,
    q: 5,
    p: 30
  },
  {
    code: "T12",
    dimension: "technical",
    label: "وجود چالش‌های فنی یا حقوقی غیرقابل حل",
    hint: "بروز معارض یا چالشی که حل آن تبعات مالی زیادی دارد",
    direction: DIRECTION.COST,
    localWeight: 6,
    q: 5,
    p: 30
  },

  // ─── بعد ریسک (Risk) ────────────────────────────────────────────────────
  {
    code: "R1",
    dimension: "risk",
    label: "ریسک‌های خود پروژه",
    hint: "ریسک‌های مربوط به مدیریت پروژه",
    direction: DIRECTION.COST,
    localWeight: 40,
    q: 5,
    p: 30
  },
  {
    code: "R2",
    dimension: "risk",
    label: "ریسک‌های سازمانی",
    hint: "ریسک مدیریتی، حقوقی و مالی داخل سازمان",
    direction: DIRECTION.COST,
    localWeight: 32,
    q: 5,
    p: 30
  },
  {
    code: "R3",
    dimension: "risk",
    label: "ریسک‌های محیطی و خارجی",
    hint: "ریسک سیاسی، اقتصادی، اجتماعی و اقلیمی",
    direction: DIRECTION.COST,
    localWeight: 28,
    q: 5,
    p: 30
  },

  // ─── بعد مالی (Financial) ───────────────────────────────────────────────
  {
    code: "F1",
    dimension: "financial",
    label: "میزان منابع و اعتبارات مالی موردنیاز (هزینه پروژه)",
    hint: "هزینه کل پروژه در مقایسه با منابع در دسترس",
    direction: DIRECTION.COST,
    localWeight: 18,
    q: 5,
    p: 30
  },
  {
    code: "F2",
    dimension: "financial",
    label: "میزان اعتبار موردنیاز برای اتمام پروژه",
    hint: "اعتبار لازم برای تکمیل پروژه‌های نیمه‌تمام",
    direction: DIRECTION.COST,
    localWeight: 14,
    q: 5,
    p: 30
  },
  {
    code: "F3",
    dimension: "financial",
    label: "سهولت تأمین مالی از منابع داخلی",
    hint: "منابع داخلی سازمان و شرکت‌های تابعه",
    direction: DIRECTION.BENEFIT,
    localWeight: 14,
    q: 5,
    p: 30
  },
  {
    code: "F4",
    dimension: "financial",
    label: "سهولت تأمین مالی از خارج سازمان",
    hint: "کمک‌های دولتی و همکاری سایر دستگاه‌ها",
    direction: DIRECTION.BENEFIT,
    localWeight: 13,
    q: 5,
    p: 30
  },
  {
    code: "F5",
    dimension: "financial",
    label: "پتانسیل اجرا با روش‌های نوین تأمین مالی",
    hint: "BOT، BOO و سایر روش‌های مشارکت بخش خصوصی",
    direction: DIRECTION.BENEFIT,
    localWeight: 13,
    q: 5,
    p: 30
  },
  {
    code: "F6",
    dimension: "financial",
    label: "هزینه‌های دوره نگهداری",
    hint: "هزینه نگهداشت پس از بهره‌برداری",
    direction: DIRECTION.COST,
    localWeight: 10,
    q: 5,
    p: 30
  },
  {
    code: "F7",
    dimension: "financial",
    label: "امکان تهاتر بخشی از هزینه‌ها",
    hint: "تبادل دارایی به جای پرداخت نقدی",
    direction: DIRECTION.BENEFIT,
    localWeight: 9,
    q: 5,
    p: 30
  },
  {
    code: "F8",
    dimension: "financial",
    label: "میزان بدهی و دیون پروژه",
    hint: "بدهی به مشاورین و پیمانکاران؛ در تخصیص بودجه اولویت‌ساز است",
    direction: DIRECTION.BENEFIT,
    localWeight: 9,
    q: 5,
    p: 30
  },

  // ─── بعد اقتصادی (Economic) ─────────────────────────────────────────────
  {
    code: "EC",
    dimension: "economic",
    label: "اقتصادی بودن پروژه (سودآوری)",
    hint: "نسبت فایده به هزینه",
    direction: DIRECTION.BENEFIT,
    localWeight: 100,
    q: 5,
    p: 30
  },

  // ─── بعد اجتماعی (Social) ───────────────────────────────────────────────
  {
    code: "S1",
    dimension: "social",
    label: "میزان تأثیر بر سلامت جسمی",
    hint: "اثر پروژه بر سلامت جسمی شهروندان",
    direction: DIRECTION.BENEFIT,
    localWeight: 17,
    q: 5,
    p: 30
  },
  {
    code: "S2",
    dimension: "social",
    label: "میزان تأثیر بر سلامت روحی و روانی",
    hint: "بوستان، فضای ورزشی و تفریحی",
    direction: DIRECTION.BENEFIT,
    localWeight: 15,
    q: 5,
    p: 30
  },
  {
    code: "S3",
    dimension: "social",
    label: "میزان تأثیر بر ایمنی و امنیت",
    hint: "تأمین امنیت در مقابل سوانح طبیعی و حوادث غیرمترقبه",
    direction: DIRECTION.BENEFIT,
    localWeight: 20,
    q: 5,
    p: 30
  },
  {
    code: "S4",
    dimension: "social",
    label: "هم‌راستایی با خواسته‌ها و نیازهای روز مردم",
    hint: "شهروندان مهم‌ترین ذی‌نفعان پروژه‌های شهری هستند",
    direction: DIRECTION.BENEFIT,
    localWeight: 17,
    q: 5,
    p: 30
  },
  {
    code: "S5",
    dimension: "social",
    label: "عدالت فضایی",
    hint: "توزیع متعادل خدمات شهری متناسب با نیاز هر محله یا ناحیه",
    direction: DIRECTION.BENEFIT,
    localWeight: 20,
    q: 5,
    p: 30
  },
  {
    code: "S6",
    dimension: "social",
    label: "پتانسیل تشکل‌ها و مشارکت مردمی",
    hint: "امکان اجرای پروژه با مشارکت خود مردم",
    direction: DIRECTION.BENEFIT,
    localWeight: 11,
    q: 5,
    p: 30
  },

  // ─── بعد زیست‌محیطی (Environmental) ─────────────────────────────────────
  {
    code: "E",
    dimension: "environmental",
    label: "تأثیر مثبت بر محیط زیست",
    hint: "کاهش آلاینده‌های هوا، آب، منابع زیرزمینی و صوتی",
    direction: DIRECTION.BENEFIT,
    localWeight: 100,
    q: 5,
    p: 30
  },

  // ─── بعد سازمانی/سیاسی (Organizational) ─────────────────────────────────
  {
    code: "O1",
    dimension: "organizational",
    label: "هم‌راستایی با مأموریت، چشم‌انداز، اهداف و راهبردهای سازمان",
    hint: "همسویی با راهبردهای طرح جامع و تفصیلی",
    direction: DIRECTION.BENEFIT,
    localWeight: 32,
    q: 5,
    p: 30
  },
  {
    code: "O2",
    dimension: "organizational",
    label: "هم‌راستایی با اهداف و استراتژی‌های اسناد بالادستی",
    hint: "سند آمایش، طرح‌های مجموعه شهری و طرح‌های بخشی",
    direction: DIRECTION.BENEFIT,
    localWeight: 28,
    q: 5,
    p: 30
  },
  {
    code: "O3",
    dimension: "organizational",
    label: "هم‌راستایی با نگرش مدیران",
    hint: "میزان مقبولیت پروژه در سطوح مدیریتی",
    direction: DIRECTION.BENEFIT,
    localWeight: 22,
    q: 5,
    p: 30
  },
  {
    code: "O4",
    dimension: "organizational",
    label: "هم‌راستایی با دستورات مراجع فراسازمانی",
    hint: "نهادهای فراسازمانی نظیر مجلس و حاکمیت",
    direction: DIRECTION.BENEFIT,
    localWeight: 18,
    q: 5,
    p: 30
  },

  // ─── بعد رقابتی (Competitive) ───────────────────────────────────────────
  {
    code: "C1",
    dimension: "competitive",
    label: "میزان تأثیر بر رقابت‌پذیری شهری",
    hint: "پروژه‌های بزرگ‌مقیاس با اثرات فراشهری",
    direction: DIRECTION.BENEFIT,
    localWeight: 50,
    q: 5,
    p: 30
  },
  {
    code: "C2",
    dimension: "competitive",
    label: "میزان جذب سرمایه‌گذاری جدید و ایجاد اشتغال",
    hint: "اشتغال مستقیم و غیرمستقیم و تشویق سرمایه‌گذاری",
    direction: DIRECTION.BENEFIT,
    localWeight: 50,
    q: 5,
    p: 30
  }
];

/**
 * معیارهای الزامی — «فیلتر شماره یک».
 *
 * Every entry is a hard, binary gate: a project that does not satisfy it is
 * removed from the comparison matrix entirely rather than being penalised in
 * the score. `appliesTo` narrows a gate to a subset of projects — the
 * شیوه‌نامه applies the mega-project attachments only to «پروژه‌های
 * بزرگ‌مقیاس».
 */
export const mandatoryCriteria = [
  {
    code: "M1",
    label: "هم‌راستایی با اسناد بالادستی کشوری و استانی",
    appliesTo: "all"
  },
  {
    code: "M2",
    label: "هم‌راستایی راهبردی با طرح‌های توسعه شهری کرمان",
    hint: "برنامه استراتژیک شهرداری، طرح جامع، طرح تفصیلی و سایر اسناد بالادستی",
    appliesTo: "all"
  },
  {
    code: "M3",
    label: "همسویی با سیاست‌های اجرایی لوایح بودجه و مصوبات شورای شهر",
    appliesTo: "all"
  },
  {
    code: "M4",
    label: "عدم تشابه یا هم‌پوشانی زیاد با سایر پروژه‌های پیشنهادی",
    hint: "پروژه‌های مشابه باید پیش از ورود به فیلتر، حذف یا ادغام شوند",
    appliesTo: "all"
  },
  {
    code: "M5",
    label: "دارا بودن مطالعات الزمه فاز پیشین",
    hint: "فاز یک نیازمند فاز صفر، فاز دو نیازمند فاز یک و اجرا نیازمند فاز دو است",
    appliesTo: "all"
  },
  {
    code: "M6-A",
    label: "تأییدیه معاونت شهرسازی و معماری",
    hint: "برای پروژه‌های معاونت حمل‌ونقل و امور زیربنایی",
    appliesTo: "megaProject"
  },
  {
    code: "M6-B",
    label: "تأییدیه معاونت حمل‌ونقل و امور زیربنایی",
    hint: "برای پروژه‌های معاونت شهرسازی و معماری",
    appliesTo: "megaProject"
  },
  {
    code: "M6-C",
    label: "پیوست فرهنگی اجتماعی",
    appliesTo: "megaProject"
  },
  {
    code: "M6-D",
    label: "پیوست زیست‌محیطی",
    appliesTo: "megaProject"
  },
  {
    code: "M6-E",
    label: "پیوست پدافند غیرعامل",
    appliesTo: "megaProject"
  },
  {
    code: "M6-F",
    label: "پیوست مطالعات توجیه اقتصادی و طرح تأمین مالی",
    appliesTo: "megaProject"
  },
  {
    code: "M6-G",
    label: "تأییدیه معاونت برنامه‌ریزی و توسعه سرمایه انسانی",
    hint: "انطباق با آینده‌پژوهی شهر، برنامه پنج‌ساله و سایر اسناد بالادستی",
    appliesTo: "megaProject"
  }
];

/**
 * هفت حوزه مأموریتی شهرداری کرمان.
 */
export const missionDomains = [
  { key: "infrastructure", label: "زیربنایی، عمرانی، حمل‌ونقل و ترافیک" },
  { key: "smart", label: "هوشمندسازی ساختار، سازمان، خدمات و محصولات" },
  { key: "revenue", label: "درآمد و اقتصاد شهری" },
  { key: "urbanism", label: "شهرسازی و معماری" },
  { key: "safety", label: "ایمنی و مدیریت بحران" },
  { key: "environment", label: "محیط زیست و خدمات شهری" },
  { key: "social", label: "اجتماعی، فرهنگی و مشارکت‌های مردمی" }
];

/**
 * پنج دسته پروژه از نظر حوزه ماهیتی.
 */
export const natureCategories = [
  { key: "study", label: "مطالعات و طراحی" },
  { key: "construction", label: "ایجاد و احداثی" },
  { key: "development", label: "توسعه‌ای" },
  { key: "acquisition", label: "تملک" },
  { key: "equipment", label: "خرید تجهیزات عمده" }
];

/**
 * The strategic goals surfaced in the UI. Kept for backward compatibility with
 * the existing dashboard.
 */
export const strategicGoals = [
  { id: "mobility", label: "شهر روان", icon: "Route" },
  { id: "green", label: "شهر سبز", icon: "Leaf" },
  { id: "resilient", label: "شهر تاب‌آور", icon: "ShieldCheck" },
  { id: "equity", label: "شهر عادلانه", icon: "Scale" },
  { id: "smart", label: "شهر هوشمند", icon: "Cpu" }
];

/**
 * Criteria grouped by the dimension they belong to.
 *
 * @type {Map<string, Array>}
 */
export const criteriaByDimension = new Map(
  dimensions.map(dimension => [
    dimension.key,
    criteria.filter(criterion => criterion.dimension === dimension.key)
  ])
);

/**
 * The default export keeps the dimension-level shape the dashboard and the
 * frontend weight sliders already consume (`key`, `label`, `hint`, `weight`),
 * so the eight dimensions — not the thirty-seven leaf criteria — remain the
 * unit the expert panel moves sliders on. Leaf criteria are reachable through
 * `criteria` and `criteriaByDimension`.
 */
export default dimensions;
