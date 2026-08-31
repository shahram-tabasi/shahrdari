/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * CRITERIA MODEL.
 *
 * Implements the criteria defined by the governing directive
 * [شیوه‌نامه شناسایی، انتخاب، اولویت‌بندی و تعریف سبد پروژه — ویرایش پنجم].
 *
 * The directive splits decision criteria into two families:
 *
 *   1. MANDATORY [معیارهای الزامی] — binary pass/fail gates. A project that
 *      fails any one of them is dropped at filter #1 and never enters the
 *      comparison matrix at all. See `mandatoryCriteria` below.
 *
 *   2. PREFERENTIAL [معیارهای ترجیحی] — graded criteria, grouped into eight
 *      dimensions that the directive itself ranks 1..8. See `dimensions` and
 *      `criteria` below.
 *
 * WHY DIMENSION WEIGHTS ARE COMPUTED, NOT TYPED IN
 * ------------------------------------------------
 * The directive states a RANKING of the eight dimensions but gives no numeric
 * weights. Rather than invent numbers, the defaults are derived from that
 * ranking with the Rank-Order Centroid method (see `rankOrderCentroidWeights`).
 * Every weight therefore traces back to a line in the directive.
 *
 * An expert panel can override them at run time via the weighting engine
 * (direct weights, or an AHP pairwise matrix); the consistency ratio is
 * recorded alongside whenever AHP is used.
 *
 * WHAT TO EDIT HERE
 * -----------------
 *   - `dimensionDefinitions` — only if the directive's ranking changes.
 *   - `criteria[].localWeight` — the relative weight of a criterion WITHIN its
 *     dimension. Safe to tune; it does not affect the dimension-level balance.
 *   - `criteria[].q` / `.p` — the PROMETHEE preference thresholds. See the
 *     note on the `criteria` array below before changing these.
 *   - `criteria[].direction` — get this wrong and the criterion's preference is
 *     silently inverted. Read the DIRECTION note below first.
 *
 * Persian strings in this file are user-visible labels shown in the UI and in
 * reports; they are not comments. Keep them.
 */

/**
 * DIRECTION OF A CRITERION.
 *
 * - `benefit` — a higher raw value is BETTER (e.g. beneficiary population).
 * - `cost`    — a higher raw value is WORSE (e.g. risk, cost, duration, debt).
 *
 * IMPORTANT: cost criteria are inverted by the normalisation engine, NOT in the
 * dataset. Never enter a pre-inverted value in the project data. If you invert
 * both here and in the data, the two cancel out and the criterion silently
 * pushes the ranking the wrong way — with no error anywhere.
 */
export const DIRECTION = Object.freeze({
  BENEFIT: "benefit",
  COST: "cost"
});

/**
 * The eight preferential dimensions, each with the rank the directive assigns
 * to it [رتبه بعد]. Rank 1 is the most important.
 *
 * Order in this array does not matter; `rank` is what drives the weights.
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
 * Rank-Order Centroid (ROC) weights.
 *
 * For `n` ranked items, the ROC weight of the item at rank `i` is:
 *
 *     w(i) = (1 / n) * SUM over j = i..n of (1 / j)
 *
 * Mathematically this is the centroid of the set of all weight vectors that
 * are consistent with the stated ordering. That makes it the defensible
 * default when a document states an ORDER but not MAGNITUDES: it commits to
 * nothing beyond the ranking that was actually written down.
 *
 * @param {number} count Number of ranked items.
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
 * The eight dimensions with their derived default weights, on a 0..100 scale
 * summing to 100. This array is what the UI weight sliders bind to.
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
 * THE 37 PREFERENTIAL CRITERIA, taken verbatim from the directive.
 *
 * Codes follow the directive's own labelling: T = technical, R = risk,
 * F = financial, EC = economic, S = social, E = environmental,
 * O = organisational, C = competitive.
 *
 * FIELDS
 * ------
 * `direction`   benefit or cost — see the DIRECTION note above. The risk
 *               dimension and the cost-like financial criteria are modelled as
 *               genuine cost criteria; they are NOT pre-inverted in the data.
 *
 * `localWeight` weight WITHIN the dimension. Only the ratios matter — the
 *               engine normalises each dimension's criteria to sum to that
 *               dimension's share, so you do not have to make them total 100.
 *
 * `q`, `p`      PROMETHEE thresholds on the normalised 0..100 scale
 *               [آستانه بی‌تفاوتی و آستانه ترجیح]:
 *                 q = differences at or below this are treated as no
 *                     difference at all (noise floor).
 *                 p = differences at or above this count as full preference.
 *               Between them preference rises linearly. RULE: p must be
 *               greater than q. Raising q makes the criterion more forgiving
 *               of small gaps; lowering p makes it more decisive.
 *               The sensitivity engine sweeps these to test how stable the
 *               ranking is against the thresholds you picked.
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
 * MANDATORY CRITERIA — FILTER #1 [معیارهای الزامی — فیلتر شماره یک].
 *
 * Each entry is a hard binary gate. A project that fails one is REMOVED from
 * the comparison matrix entirely — it is never merely penalised in its score.
 * That is the directive's own wording and the reason screening is a separate
 * engine rather than another criterion.
 *
 * `appliesTo` narrows a gate to a subset of projects:
 *   "all"          — every project must answer it.
 *   "megaProject"  — only projects with `classification.megaProject === true`.
 *                    The directive attaches the extra sign-offs (M6-*) to
 *                    large-scale projects only.
 *
 * To add a gate: append an entry here and add the matching key to each
 * project's `mandatory` object. A project with no answer for an applicable gate
 * is REJECTED, not waved through — screening deliberately fails closed.
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
 * The seven municipal mission domains [هفت حوزه مأموریتی].
 * `key` values are referenced by `financialConstraints.domainShares` in
 * `policy.js` — keep the two in sync.
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
 * The five project nature categories [حوزه ماهیتی].
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
 * Criteria indexed by their dimension. Built once at module load.
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
 * DEFAULT EXPORT = the eight dimensions.
 *
 * The dashboard and the weight sliders consume this shape (`key`, `label`,
 * `hint`, `weight`). The eight dimensions — not the thirty-seven leaf criteria
 * — are what an expert panel actually adjusts; putting 37 sliders in front of a
 * committee is not a usable interface.
 *
 * The leaf criteria remain reachable via the named exports `criteria` and
 * `criteriaByDimension`, and they are what the ranking engine evaluates on.
 */
export default dimensions;
