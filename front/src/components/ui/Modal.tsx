/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-3xl'
}: ModalProps) {
  return (
    <AnimatePresence>
      {open ?
      <motion.div
        className="fixed inset-0 z-50 grid place-items-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}>
        
          <div
          className="absolute inset-0 bg-navy-900/45 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true" />
        
          <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className={`relative w-full ${width} max-h-[86vh] overflow-auto thin-scroll rounded-2xl bg-surface shadow-lift dark:bg-night-700`}>
          
            <div className="flex items-start justify-between gap-6 border-b border-navy-800/8 px-8 py-6 dark:border-white/8">
              <div>
                <h2 className="text-lg font-extrabold text-ink-900 dark:text-white/90">
                  {title}
                </h2>
                {subtitle ?
              <p className="mt-1 text-xs text-ink-500 dark:text-white/45">
                    {subtitle}
                  </p> :
              null}
              </div>
              <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 transition hover:bg-navy-800/8 hover:text-navy-800 dark:text-white/50 dark:hover:bg-white/10">
              
                <XIcon size={18} />
              </button>
            </div>
            <div className="p-8">{children}</div>
          </motion.div>
        </motion.div> :
      null}
    </AnimatePresence>);

}