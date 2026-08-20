import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  GitCompareArrowsIcon,
  GripVerticalIcon,
  LightbulbIcon,
  StarIcon,
  Table2Icon } from
'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge, StatusBadge } from '../ui/Badge';
import { useData } from '../../contexts/DataContext';
import type { RankedProject } from '../../utils/scoring';
import { faNum, faShortBudget } from '../../utils/format';

interface Props {
  rows: RankedProject[];
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  onOpenRadar: (project: RankedProject) => void;
  onReorder: (order: string[]) => void;
  onCompare: () => void;
}

export function RankingTable({
  rows,
  compareIds,
  onToggleCompare,
  onOpenRadar,
  onReorder,
  onCompare
}: Props) {
  const { categoryColors } = useData();
  const [dragId, setDragId] = useState<string | null>(null);
  const [explainId, setExplainId] = useState<string | null>(null);

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const order = rows.map((r) => r.id);
    const from = order.indexOf(dragId);
    const to = order.indexOf(targetId);
    order.splice(to, 0, ...order.splice(from, 1));
    onReorder(order);
    setDragId(null);
  };

  return (
    <Card>
      <CardHeader
        title="جدول رتبه‌بندی هوشمند"
        subtitle="امتیاز با تغییر وزن‌ها بلافاصله بازمحاسبه می‌شود • برای اولویت دستی، ردیف را جابجا کنید"
        icon={<Table2Icon size={17} />}
        action={
        <button
          type="button"
          onClick={onCompare}
          disabled={compareIds.length !== 2}
          className="flex items-center gap-2 rounded-lg bg-navy-800 px-4 py-2.5 text-[11px] font-bold text-white transition hover:bg-navy-700 disabled:opacity-40 dark:bg-navy-500">
          
            <GitCompareArrowsIcon size={15} />
            مقایسه دو پروژه ({faNum(compareIds.length)}/۲)
          </button>
        } />
      

      <div className="overflow-x-auto thin-scroll px-6 pb-6">
        <table className="w-full min-w-[900px] text-xs">
          <thead>
            <tr className="text-ink-500 dark:text-white/45">
              <th className="w-10 pb-3" />
              <th className="w-16 pb-3 text-center font-bold">رتبه</th>
              <th className="pb-3 text-right font-bold">نام پروژه</th>
              <th className="w-28 pb-3 text-center font-bold">امتیاز نهایی</th>
              <th className="w-28 pb-3 text-center font-bold">ضریب عدالت</th>
              <th className="w-28 pb-3 text-center font-bold">بودجه</th>
              <th className="w-28 pb-3 text-center font-bold">وضعیت</th>
              <th className="w-28 pb-3 text-center font-bold">تحلیل / مقایسه</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
            <React.Fragment key={row.id}>
                <motion.tr
                layout
                draggable
                onDragStart={() => setDragId(row.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(row.id)}
                className={[
                'group cursor-pointer border-t border-navy-800/6 transition dark:border-white/6',
                dragId === row.id ?
                'opacity-40' :
                'hover:bg-canvas dark:hover:bg-white/5'].
                join(' ')}
                onClick={() => onOpenRadar(row)}>
                
                  <td className="py-3 text-center">
                    <GripVerticalIcon
                    size={15}
                    className="mx-auto text-ink-300 dark:text-white/25" />
                  
                  </td>
                  <td className="py-3 text-center">
                    <span
                    className={[
                    'inline-grid h-8 w-8 place-items-center rounded-lg text-xs font-extrabold',
                    row.rank <= 3 ?
                    'bg-amber-500 text-navy-900' :
                    'bg-navy-800/8 text-navy-800 dark:bg-white/10 dark:text-white/70'].
                    join(' ')}>
                    
                      {faNum(row.rank)}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center gap-2">
                      <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: categoryColors[row.category] }} />
                    
                      <span className="font-bold text-ink-900 dark:text-white/85">
                        {row.name}
                      </span>
                      {row.aiRecommended ?
                    <span
                      title="توصیه هوش مصنوعی: ارزش استراتژیک پنهان"
                      className="grid h-5 w-5 place-items-center rounded-md bg-amber-500/15 text-amber-500">
                      
                          <StarIcon size={12} fill="currentColor" />
                        </span> :
                    null}
                    </div>
                    <p className="mt-1 text-[10px] text-ink-500 dark:text-white/40">
                      {row.id} • {row.district} • {row.category}
                    </p>
                  </td>
                  <td className="py-3 text-center">
                    <div className="mx-auto w-20">
                      <p className="text-sm font-extrabold text-ink-900 dark:text-white/90">
                        {faNum(row.finalScore, 1)}
                      </p>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-navy-800/8 dark:bg-white/10">
                        <motion.span
                        className="block h-full rounded-full bg-navy-800 dark:bg-navy-300"
                        animate={{ width: `${row.finalScore}%` }}
                        transition={{ type: 'spring', stiffness: 200, damping: 26 }} />
                      
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <Badge tone={row.justice >= 0.75 ? 'green' : row.justice >= 0.6 ? 'amber' : 'red'}>
                      {faNum(row.justice, 2)}
                    </Badge>
                  </td>
                  <td className="py-3 text-center text-[11px] font-semibold text-ink-700 dark:text-white/65">
                    {faShortBudget(row.budget)}
                  </td>
                  <td className="py-3 text-center">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                      type="button"
                      aria-label="توضیح هوش مصنوعی"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExplainId(explainId === row.id ? null : row.id);
                      }}
                      className={[
                      'grid h-8 w-8 place-items-center rounded-lg transition',
                      explainId === row.id ?
                      'bg-amber-500 text-navy-900' :
                      'bg-amber-500/12 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400'].
                      join(' ')}>
                      
                        <LightbulbIcon size={15} />
                      </button>
                      <label
                      className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg bg-navy-800/8 dark:bg-white/10"
                      onClick={(e) => e.stopPropagation()}>
                      
                        <input
                        type="checkbox"
                        className="h-3.5 w-3.5 accent-[#1A237E]"
                        checked={compareIds.includes(row.id)}
                        onChange={() => onToggleCompare(row.id)}
                        aria-label={`انتخاب ${row.name} برای مقایسه`} />
                      
                      </label>
                    </div>
                  </td>
                </motion.tr>

                <AnimatePresence>
                  {explainId === row.id ?
                <tr>
                      <td colSpan={8} className="p-0">
                        <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden">
                      
                          <div className="my-2 flex gap-3 rounded-lg border-r-4 border-amber-500 bg-amber-500/6 px-5 py-4">
                            <LightbulbIcon
                          size={17}
                          className="mt-0.5 shrink-0 text-amber-500" />
                        
                            <div>
                              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                                توضیح‌دهنده هوشمند (AI Explainability)
                              </p>
                              <p className="mt-1.5 text-[11px] leading-6 text-ink-700 dark:text-white/70">
                                {row.explain}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </td>
                    </tr> :
                null}
                </AnimatePresence>
              </React.Fragment>
            )}
          </tbody>
        </table>
      </div>
    </Card>);

}
