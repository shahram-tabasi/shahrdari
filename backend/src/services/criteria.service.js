import * as criteriaRepository from "../repositories/criteria.repository.js";
import { DIRECTION } from "../data/criteria.js";
import HttpError from "../utils/http-error.js";

/**
 * مدیریت معیارها — «تعریف شاخص، مقیاس، جهت و منبع داده».
 *
 * The dimension list stays the frontend's weighting surface (`key`, `label`,
 * `hint`, `weight`), while the full model — leaf criteria, directions,
 * thresholds and mandatory gates — is served alongside it.
 */

/**
 * The eight dimensions.
 *
 * @returns {Promise<Array>}
 */
export async function getAllCriteria() {
  return criteriaRepository.findDimensions();
}

/**
 * The complete criteria model.
 *
 * @returns {Promise<Object>}
 */
export async function getCriteriaModel() {
  const [dimensions, criteria, mandatory] = await Promise.all([
    criteriaRepository.findDimensions(),
    criteriaRepository.findCriteria(),
    criteriaRepository.findMandatoryCriteria()
  ]);

  return {
    basis: "شیوه‌نامه شناسایی، انتخاب، اولویت‌بندی و تعریف سبد پروژه — ویرایش پنجم",
    weighting: {
      defaultMethod: "rank-order-centroid",
      note: "وزن پیش‌فرض ابعاد از رتبه‌ای که شیوه‌نامه برای هر بعد تعیین کرده استخراج می‌شود و با ماتریس مقایسات زوجی (AHP) قابل بازنگری است."
    },
    dimensions,
    criteria,
    mandatoryCriteria: mandatory,
    counts: {
      dimensions: dimensions.length,
      preferential: criteria.length,
      mandatory: mandatory.length
    }
  };
}

/**
 * Retrieve one dimension or one leaf criterion, by key or code.
 *
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getCriterionById(id) {
  const criterion = await criteriaRepository.findByIdentifier(id);

  if (!criterion) {
    throw new HttpError(404, "معیار مورد نظر یافت نشد.");
  }

  return criterion;
}

/**
 * Replace the dimension weights.
 *
 * Changing an official criterion set is a governed act, so this validates
 * rather than trusting the caller: unknown keys, malformed weights and unknown
 * directions are all rejected. Leaf criteria are not editable over the API —
 * they are the شیوه‌نامه's own list, and changing them is a change to the
 * شیوه‌نامه, not a configuration tweak.
 *
 * @param {Array} collection
 * @returns {Promise<Array>}
 */
export async function replaceCriteria(collection) {
  if (!Array.isArray(collection) || collection.length === 0) {
    throw new HttpError(400, "فهرست ابعاد باید آرایه‌ای غیرخالی باشد.");
  }

  const existing = await criteriaRepository.findDimensions();
  const known = new Map(existing.map(dimension => [dimension.key, dimension]));
  const errors = [];

  const updated = collection.map((entry, index) => {
    const base = known.get(entry?.key);

    if (!base) {
      errors.push({
        field: `[${index}].key`,
        message: `بعد «${entry?.key ?? "نامشخص"}» در مدل معیارهای شیوه‌نامه تعریف نشده است.`
      });

      return null;
    }

    if (!Number.isFinite(entry.weight) || entry.weight < 0 || entry.weight > 100) {
      errors.push({
        field: `[${index}].weight`,
        message: "وزن بعد باید عددی بین ۰ و ۱۰۰ باشد."
      });

      return null;
    }

    if (
      entry.direction !== undefined &&
      entry.direction !== DIRECTION.BENEFIT &&
      entry.direction !== DIRECTION.COST
    ) {
      errors.push({
        field: `[${index}].direction`,
        message: "جهت معیار باید benefit یا cost باشد."
      });

      return null;
    }

    // Label, rank and code come from the شیوه‌نامه and are not caller-editable.
    return { ...base, weight: entry.weight };
  });

  if (errors.length > 0) {
    throw new HttpError(400, "اعتبارسنجی ابعاد ناموفق بود.", errors);
  }

  const total = updated.reduce((sum, dimension) => sum + dimension.weight, 0);

  if (!(total > 0)) {
    throw new HttpError(400, "مجموع وزن ابعاد باید بزرگ‌تر از صفر باشد.");
  }

  const missing = existing
    .filter(dimension => !collection.some(entry => entry.key === dimension.key))
    .map(dimension => dimension.key);

  if (missing.length > 0) {
    throw new HttpError(
      400,
      "همه ابعاد باید در به‌روزرسانی حضور داشته باشند.",
      missing.map(key => ({ field: key, message: "این بعد در فهرست ارسالی نیست." }))
    );
  }

  return criteriaRepository.replaceDimensions(updated);
}
