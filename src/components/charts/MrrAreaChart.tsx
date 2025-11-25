'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TimeseriesPoint } from '@/lib/types';

interface MrrAreaChartProps {
  timeseries: TimeseriesPoint[];
  selectedProjectIds: string[];
}

const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#fb7185', '#38bdf8'];

const formatDateLabel = (iso: string) => {
  const date = new Date(`${iso}-01`);
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }).format(date);
};

export const MrrAreaChart = ({ timeseries, selectedProjectIds }: MrrAreaChartProps) => {
  const data = timeseries.map((point) => {
    const row: Record<string, number | string> = { date: point.date };
    selectedProjectIds.forEach((id) => {
      row[id] = point.projects[id]?.mrr ?? 0;
    });
    return row;
  });

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
          <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke="#94a3b8" tickLine={false} />
          <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(148,163,184,0.2)' }}
            labelFormatter={formatDateLabel}
            formatter={(value: number, name) => [`$${value.toLocaleString()}`, name]}
          />
          {selectedProjectIds.map((projectId, index) => (
            <Area
              key={projectId}
              type="monotone"
              dataKey={projectId}
              stackId="mrr"
              stroke={COLORS[index % COLORS.length]}
              fill={COLORS[index % COLORS.length]}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
