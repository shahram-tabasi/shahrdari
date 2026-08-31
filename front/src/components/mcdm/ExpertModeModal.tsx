/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { useApp } from '../../contexts/AppContext';
import { useData } from '../../contexts/DataContext';
import { createRanking } from '../../services/api';
import type { CriterionKey, WeightingResult } from '../../types';
import { faNum } from '../../utils/format';

/**
 * EXPERT MODE — AHP pairwise comparison.
 *
 * The expert panel judges each pair of dimensions on Saaty's 1/9…9 scale. The
 * backend derives the priority vector from the principal eigenvector and
 * returns the consistency ratio alongside it; a ratio above 0.1 means the
 * judgements contradict each other and the weights must not be applied.
 *
 * IMPORTANT — the matrix is sized from the criteria list at run time, never
 * hardcoded. The directive's dimension count changes between editions, and a
 * fixed-size matrix silently drops the dimensions past its last row.
 *
 * Reciprocity is maintained as the expert types: setting a(i,j) sets
 * a(j,i) = 1/a(i,j), because an AHP matrix that is not reciprocal is not a
 * valid comparison matrix at all.
 */

/** Saaty's scale bounds. Values outside this range are not judgements. */
const SAATY_MIN = 1 / 9;
const SAATY_MAX = 9;
const CONSISTENCY_THRESHOLD = 0.1;

/**
 * Seed matrix built from the ranks the directive assigns the dimensions.
 *
 * A dimension that outranks another by `n` places starts at a judgement of
 * `n + 1`, capped at 9. This is only a starting point for the panel to edit —
 * it encodes the directive's own ordering so the panel begins from the
 * official priority rather than from an all-ones matrix that says nothing.
 */
function seedMatrix(ranks: number[]): number[][] {
  return ranks.map((rowRank) =>
    ranks.map((columnRank) => {
      if (rowRank === columnRank) {
        return 1;
      }

      const judgement = Math.min(SAATY_MAX, Math.abs(columnRank - rowRank) + 1);

      return rowRank < columnRank ? judgement : 1 / judgement;
    })
  );
}

/** Render a matrix cell so it is readable but still editable as a number. */
function cellText(value: number): string {
  if (value >= 1) {
    return String(Math.round(value * 100) / 100);
  }

  // Reciprocals read as 1/n, which is how the Saaty scale is written.
  return `1/${Math.round(1 / value)}`;
}

/** Accept either `3`, `0.33` or `1/3`. Returns null for anything else. */
function parseJudgement(input: string): number | null {
  const text = input.trim();
  const fraction = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(text);
  const value = fraction
    ? Number(fraction[1]) / Number(fraction[2])
    : Number(text);

  if (!Number.isFinite(value) || value < SAATY_MIN || value > SAATY_MAX) {
    return null;
  }

  return value;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /**
   * Called with the derived dimension weights once the panel applies a
   * consistent matrix. The parent owns the weights; this modal only computes.
   */
  onApply?: (weights: Record<CriterionKey, number>) => void;
}

export function ExpertModeModal({ open, onClose, onApply }: Props) {
  const { t } = useApp();
  const { criteria } = useData();

  const keys = useMemo(() => criteria.map((c) => c.key), [criteria]);
  const initial = useMemo(
    () => seedMatrix(criteria.map((c) => c.rank)),
    [criteria]
  );

  const [matrix, setMatrix] = useState<number[][]>(initial);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [weighting, setWeighting] = useState<WeightingResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset whenever the modal is reopened or the criteria model changes, so a
  // previous panel's judgements never leak into a new session.
  useEffect(() => {
    if (open) {
      setMatrix(initial);
      setDrafts({});
      setWeighting(null);
      setError(null);
    }
  }, [open, initial]);

  const setJudgement = (row: number, column: number, raw: string) => {
    setDrafts((previous) => ({ ...previous, [`${row}:${column}`]: raw }));

    const value = parseJudgement(raw);

    if (value === null) {
      return;
    }

    setMatrix((previous) => {
      const next = previous.map((entries) => [...entries]);

      next[row][column] = value;
      next[column][row] = 1 / value;

      return next;
    });

    // The reciprocal cell now disagrees with whatever the expert had typed
    // there, so drop its draft and let it re-render from the matrix.
    setDrafts((previous) => {
      const next = { ...previous };

      delete next[`${column}:${row}`];

      return next;
    });
  };

  const apply = async () => {
    setBusy(true);
    setError(null);

    try {
      // The backend is the authority on both the priority vector and the
      // consistency ratio; nothing is derived here.
      const result = await createRanking({ pairwise: { keys, matrix } });

      setWeighting(result.weighting);

      if (result.weighting.consistent) {
        onApply?.(result.weighting.dimensionWeights);
        onClose();
      }
    } catch (applyError) {
      setError(
        applyError instanceof Error
          ? applyError.message
          : t('محاسبه وزن‌ها ناموفق بود.', 'Weight derivation failed.')
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t(
        'حالت خبره — ماتریس مقایسات زوجی (AHP)',
        'Expert mode — AHP pairwise comparison matrix'
      )}
      subtitle={t(
        'قضاوت کارشناسی روی مقیاس ۱ تا ۹ ساعتی؛ وزن‌ها و نسبت سازگاری در سرور محاسبه می‌شوند.',
        'Panel judgements on Saaty’s 1–9 scale; weights and the consistency ratio are computed on the server.'
      )}
      width="max-w-4xl">

      <div className="overflow-auto thin-scroll">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-xs">
          <thead>
            <tr>
              <th className="sticky top-0 rounded-tr-lg bg-canvas p-3 text-right font-bold text-ink-500 dark:bg-white/5 dark:text-white/50">
                {t('معیار', 'Criterion')}
              </th>
              {criteria.map((c) =>
                <th
                  key={c.key}
                  className="bg-canvas p-3 text-center text-[10px] font-bold text-ink-500 dark:bg-white/5 dark:text-white/50">

                  {c.label}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {criteria.map((row, i) =>
              <tr key={row.key}>
                <th className="border-b border-navy-800/6 p-3 text-right text-[11px] font-bold text-ink-900 dark:border-white/6 dark:text-white/80">
                  {row.label}
                </th>
                {criteria.map((column, j) => {
                  const draft = drafts[`${i}:${j}`];
                  const invalid = draft !== undefined && parseJudgement(draft) === null;

                  return (
                    <td
                      key={column.key}
                      className="border-b border-navy-800/6 p-2 text-center dark:border-white/6">

                      <input
                        value={draft ?? cellText(matrix[i]?.[j] ?? 1)}
                        onChange={(event) => setJudgement(i, j, event.target.value)}
                        aria-label={t(
                          `مقایسه ${row.label} با ${column.label}`,
                          `Compare ${row.label} with ${column.label}`
                        )}
                        aria-invalid={invalid}
                        className={[
                          'h-9 w-16 rounded-lg border text-center text-[11px] font-bold outline-none transition focus:border-amber-500',
                          i === j
                            ? 'border-transparent bg-navy-800/6 text-ink-300 dark:bg-white/6 dark:text-white/30'
                            : invalid
                            ? 'border-rose-500 text-rose-600'
                            : 'border-navy-800/12 text-ink-900 dark:border-white/12 dark:text-white/85'
                        ].join(' ')}
                        readOnly={i === j} />

                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {weighting ?
        <div
          className={[
            'mt-4 rounded-lg p-4 text-[11px] leading-6',
            weighting.consistent
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
          ].join(' ')}>

          <p className="font-bold">
            {t('نسبت سازگاری', 'Consistency ratio')}:{' '}
            {faNum(weighting.consistencyRatio ?? 0, 3)}{' '}
            {weighting.consistent
              ? t('(قابل قبول)', '(acceptable)')
              : t(
                  `(بیش از حد مجاز ${faNum(CONSISTENCY_THRESHOLD, 1)} — قضاوت‌ها متناقض‌اند)`,
                  `(above the ${CONSISTENCY_THRESHOLD} threshold — the judgements contradict each other)`
                )}
          </p>
          {weighting.warnings.map((warning) =>
            <p key={warning} className="mt-1">{warning}</p>
          )}
        </div> :
        null}

      {error ?
        <p className="mt-4 rounded-lg bg-rose-500/10 p-4 text-[11px] font-bold text-rose-700 dark:text-rose-400">
          {error}
        </p> :
        null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-canvas p-4 dark:bg-white/5">
        <p className="text-[11px] leading-5 text-ink-500 dark:text-white/45">
          {t(
            'وزن‌های محاسبه‌شده جایگزین مقادیر اسلایدرها می‌شود و در «ردپای تصمیم» ثبت می‌گردد. وزن ناسازگار اعمال نمی‌شود.',
            'The derived weights replace the slider values and are written to the decision trail. Inconsistent judgements are not applied.'
          )}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-navy-800/12 px-4 py-2.5 text-xs font-semibold text-ink-700 dark:border-white/12 dark:text-white/60">

            {t('انصراف', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={() => void apply()}
            disabled={busy}
            className="rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-bold text-navy-900 shadow-glow disabled:opacity-50">

            {busy
              ? t('در حال محاسبه…', 'Computing…')
              : t('محاسبه و اعمال وزن‌ها', 'Compute and apply weights')}
          </button>
        </div>
      </div>
    </Modal>);

}
