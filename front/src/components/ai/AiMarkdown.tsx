import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const CHART_COLORS = ['#FF8F00', '#2979FF', '#00A86B', '#8E24AA', '#E53935', '#00838F'];

interface ChartSeries {
  key: string;
  label?: string;
}

interface ChartSpec {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: Array<Record<string, string | number>>;
  xKey?: string;
  nameKey?: string;
  valueKey?: string;
  series?: ChartSeries[];
}

function isChartSpec(value: unknown): value is ChartSpec {
  if (!value || typeof value !== 'object') return false;

  const chart = value as Partial<ChartSpec>;
  return (
    (chart.type === 'bar' || chart.type === 'line' || chart.type === 'pie') &&
    typeof chart.title === 'string' &&
    Array.isArray(chart.data) &&
    chart.data.length > 0 &&
    chart.data.every(row => row && typeof row === 'object')
  );
}

function AiChart({ source }: { source: string }) {
  let spec: ChartSpec;

  try {
    const parsed = JSON.parse(source) as unknown;

    if (!isChartSpec(parsed)) {
      throw new Error('Invalid chart schema.');
    }

    spec = parsed;
  } catch {
    return (
      <div className="my-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
        ساختار نمودار ارسال‌شده توسط هوش مصنوعی معتبر نیست.
      </div>
    );
  }

  const series = spec.series?.filter(item => typeof item.key === 'string') ?? [];
  const common = {
    data: spec.data,
    margin: { top: 10, right: 12, bottom: 18, left: 8 }
  };

  return (
    <figure className="ai-chart my-6" aria-label={spec.title}>
      <figcaption className="mb-3 text-center text-base font-bold text-ink-900 dark:text-white/90">
        {spec.title}
      </figcaption>
      <div className="h-[320px] w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          {spec.type === 'pie' ? (
            <PieChart>
              <Pie
                data={spec.data}
                dataKey={spec.valueKey ?? 'value'}
                nameKey={spec.nameKey ?? 'name'}
                cx="50%"
                cy="48%"
                outerRadius="72%"
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {spec.data.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" />
            </PieChart>
          ) : spec.type === 'line' ? (
            <LineChart {...common}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey={spec.xKey ?? 'name'} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {series.map((item, index) => (
                <Line
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.label ?? item.key}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2.5}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart {...common}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey={spec.xKey ?? 'name'} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {series.map((item, index) => (
                <Bar
                  key={item.key}
                  dataKey={item.key}
                  name={item.label ?? item.key}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  radius={[5, 5, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

const markdownComponents: Components = {
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto rounded-xl border border-navy-800/10 dark:border-white/10">
      <table>{children}</table>
    </div>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer">{children}</a>
  ),
  code: ({ className, children, ...props }) => {
    const language = className?.replace('language-', '');
    const source = String(children).replace(/\n$/, '');

    if (language === 'chart') {
      return <AiChart source={source} />;
    }

    return <code className={className} {...props}>{children}</code>;
  }
};

export function AiMarkdown({ content, className = '' }: { content: string; className?: string }) {
  return (
    <div className={`ai-markdown ${className}`} dir="rtl">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
