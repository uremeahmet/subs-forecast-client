'use client';

import { useId } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';

interface SparklineDatum {
  label: string;
  value: number;
}

interface SparkTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: { label?: string } }>;
}

interface SparklineProps {
  data: SparklineDatum[];
  color?: string;
}

const SparkTooltip = ({ active, payload }: SparkTooltipProps) => {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  const label = point?.payload?.label as string | undefined;
  const value = typeof point?.value === 'number' ? point.value : null;

  return (
    <div className="rounded-lg border border-slate-600/40 bg-slate-900/90 px-3 py-2 text-xs text-white">
      <p className="font-semibold">{label ?? '—'}</p>
      <p className="text-[11px] text-white/70">{value !== null ? value.toLocaleString() : '—'}</p>
    </div>
  );
};

export const Sparkline = ({ data, color = '#60a5fa' }: SparklineProps) => {
  const gradientId = useId();
  const chartData = data.map((entry, index) => ({ ...entry, index }));

  if (!chartData.length) {
    return <div className="h-10 w-full" />;
  }

  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            fillOpacity={0.4}
          />
          <Tooltip isAnimationActive={false} content={<SparkTooltip />} cursor={{ stroke: color, strokeWidth: 1 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
