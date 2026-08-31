/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div
      dir="rtl"
      className="
        markdown-content
        text-right
        text-xs
        leading-7
        text-ink-700
        dark:text-white/75
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-2 text-xl font-extrabold leading-8 text-ink-900 dark:text-white">
              {children}
            </h1>
          ),

          h2: ({ children }) => (
            <h2 className="mb-3 mt-5 text-lg font-extrabold leading-8 text-ink-900 dark:text-white">
              {children}
            </h2>
          ),

          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-sm font-extrabold leading-7 text-ink-900 dark:text-white">
              {children}
            </h3>
          ),

          h4: ({ children }) => (
            <h4 className="mb-2 mt-3 text-xs font-bold leading-6 text-ink-900 dark:text-white">
              {children}
            </h4>
          ),

          p: ({ children }) => (
            <p className="mb-3 text-right leading-7 last:mb-0">
              {children}
            </p>
          ),

          strong: ({ children }) => (
            <strong className="font-extrabold text-ink-900 dark:text-white">
              {children}
            </strong>
          ),

          ul: ({ children }) => (
            <ul className="mb-4 mr-5 list-disc space-y-1 text-right">
              {children}
            </ul>
          ),

          ol: ({ children }) => (
            <ol className="mb-4 mr-5 list-decimal space-y-1 text-right">
              {children}
            </ol>
          ),

          li: ({ children }) => (
            <li className="pr-1 leading-7">
              {children}
            </li>
          ),

          blockquote: ({ children }) => (
            <blockquote className="my-4 border-r-4 border-amber-500 bg-amber-500/5 px-4 py-3 text-right italic dark:bg-amber-500/10">
              {children}
            </blockquote>
          ),

          code: ({ children, className }) => {
            const isBlock = Boolean(className);

            if (isBlock) {
              return (
                <pre
                  dir="ltr"
                  className="my-4 overflow-x-auto rounded-lg bg-navy-900 p-4 text-left text-[11px] leading-6 text-white"
                >
                  <code>{children}</code>
                </pre>
              );
            }

            return (
              <code className="rounded bg-navy-800/8 px-1.5 py-0.5 text-[11px] font-semibold dark:bg-white/10">
                {children}
              </code>
            );
          },

          hr: () => (
            <hr className="my-5 border-navy-800/10 dark:border-white/10" />
          ),

          table: ({ children }) => (
            <div className="my-4 w-full overflow-x-auto rounded-lg border border-navy-800/10 dark:border-white/10">
              <table className="w-full min-w-[520px] border-collapse text-right">
                {children}
              </table>
            </div>
          ),

          thead: ({ children }) => (
            <thead className="bg-navy-800/8 dark:bg-white/10">
              {children}
            </thead>
          ),

          tbody: ({ children }) => (
            <tbody className="divide-y divide-navy-800/8 dark:divide-white/8">
              {children}
            </tbody>
          ),

          tr: ({ children }) => (
            <tr className="transition hover:bg-navy-800/4 dark:hover:bg-white/5">
              {children}
            </tr>
          ),

          th: ({ children }) => (
            <th className="whitespace-nowrap px-3 py-2.5 text-right text-[11px] font-extrabold text-ink-900 dark:text-white">
              {children}
            </th>
          ),

          td: ({ children }) => (
            <td className="px-3 py-2.5 text-right text-[11px] text-ink-700 dark:text-white/70">
              {children}
            </td>
          ),

          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-amber-600 underline decoration-amber-500/40 underline-offset-2 hover:text-amber-500 dark:text-amber-400"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}