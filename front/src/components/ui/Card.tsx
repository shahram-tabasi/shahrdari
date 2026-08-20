import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'aside';
}

export function Card({ children, className, as = 'div' }: CardProps) {
  const Tag = as;
  return (
    <Tag
      className={twMerge(
        'rounded-xl bg-surface shadow-soft border border-navy-800/5 dark:bg-night-700 dark:border-white/5',
        className
      )}>
      
      {children}
    </Tag>);

}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
  className
}: CardHeaderProps) {
  return (
    <div
      className={twMerge(
        'flex items-start justify-between gap-4 px-6 pt-5 pb-4',
        className
      )}>
      
      <div className="flex items-start gap-3">
        {icon ?
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy-800/8 text-navy-800 dark:bg-white/8 dark:text-navy-100">
            {icon}
          </span> :
        null}
        <div>
          <h2 className="text-base font-bold text-ink-900 dark:text-white/90">
            {title}
          </h2>
          {subtitle ?
          <p className="mt-1 text-xs leading-5 text-ink-500 dark:text-white/45">
              {subtitle}
            </p> :
          null}
        </div>
      </div>
      {action}
    </div>);

}