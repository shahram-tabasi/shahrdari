/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import React from 'react';
import { FlameIcon, LayersIcon, SlidersHorizontalIcon } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { faNum } from '../../utils/format';

interface Props {
  showHeat: boolean;
  onToggleHeat: () => void;
  showPins: boolean;
  onTogglePins: () => void;
  active: string[];
  onToggleCategory: (cat: string) => void;
  minBudget: number;
  onMinBudget: (v: number) => void;
  visibleCount: number;
}

export function MapFilters({
  showHeat,
  onToggleHeat,
  showPins,
  onTogglePins,
  active,
  onToggleCategory,
  minBudget,
  onMinBudget,
  visibleCount
}: Props) {
  const { categoryColors } = useData();

  return (
    <div className="pointer-events-auto w-[300px] rounded-xl border border-white/10 bg-night-900/92 p-5 text-white shadow-lift backdrop-blur-md">
      <p className="flex items-center gap-2 text-xs font-extrabold">
        <SlidersHorizontalIcon size={16} className="text-amber-500" />
        لایه‌ها و فیلترها
      </p>

      <div className="mt-4 space-y-2.5">
        {[
        { on: showHeat, toggle: onToggleHeat, label: 'لایه حرارتی محرومیت', icon: FlameIcon },
        { on: showPins, toggle: onTogglePins, label: 'پین پروژه‌ها', icon: LayersIcon }].
        map((row) =>
        <button
          key={row.label}
          type="button"
          onClick={row.toggle}
          className="flex w-full items-center justify-between gap-3 rounded-lg bg-white/6 px-3.5 py-3 text-[11px] font-semibold transition hover:bg-white/10">
          
            <span className="flex items-center gap-2 text-white/80">
              <row.icon size={15} className="text-amber-400" />
              {row.label}
            </span>
            <span
            className={[
            'relative h-5 w-9 rounded-full transition',
            row.on ? 'bg-amber-500' : 'bg-white/20'].
            join(' ')}>
            
              <span
              className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
              style={{ right: row.on ? 2 : 18 }} />
            
            </span>
          </button>
        )}
      </div>

      <p className="mt-5 text-[10px] font-bold tracking-widest text-white/35">
        دسته‌بندی پروژه
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {Object.entries(categoryColors).map(([cat, color]) => {
          const on = active.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onToggleCategory(cat)}
              className={[
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition',
              on ? 'text-white' : 'text-white/35'].
              join(' ')}
              style={{ backgroundColor: on ? `${color}33` : 'rgba(255,255,255,0.06)' }}>
              
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: on ? color : 'rgba(255,255,255,0.3)' }} />
              
              {cat}
            </button>);

        })}
      </div>

      <p className="mt-5 text-[10px] font-bold tracking-widest text-white/35">
        حداقل بودجه پروژه
      </p>
      <input
        type="range"
        min={0}
        max={1000}
        step={50}
        value={minBudget}
        onChange={(e) => onMinBudget(Number(e.target.value))}
        aria-label="حداقل بودجه"
        className="mt-3 w-full" />
      
      <p className="mt-2 text-[11px] font-bold text-amber-400">
        نمایش پروژه‌های بالای {faNum(minBudget)} میلیارد تومان
      </p>

      <div className="mt-5 space-y-2 rounded-lg bg-white/6 p-3.5">
        <p className="text-[11px] font-bold text-white/80">
          {faNum(visibleCount)} پروژه در نمای فعلی
        </p>
        <div className="flex items-center gap-2 text-[10px] text-white/50">
          <span className="h-2.5 w-16 rounded-full bg-gradient-to-l from-emerald-500 via-amber-400 to-rose-600" />
          برخوردار ← محروم
        </div>
      </div>
    </div>);

}
