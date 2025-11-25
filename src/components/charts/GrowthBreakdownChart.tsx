'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TimeseriesPoint } from '@/lib/types';

interface GrowthBreakdownChartProps {
  timeseries: TimeseriesPoint[];
}

export const GrowthBreakdownChart = ({ timeseries }: GrowthBreakdownChartProps) => {
  const data = timeseries.map((point) => ({
    date: point.date,
    newMRR: point.totals.newMRR,
    expansionMRR: point.totals.expansionMRR,
    churnMRR: -point.totals.churnMRR,
    contractionMRR: -point.totals.contractionMRR,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tickFormatter={(value) => new Date(`${value}-01`).toLocaleDateString('en-US', { month: 'short' })} stroke="#94a3b8" tickLine={false} />
          <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(148,163,184,0.2)' }}
            formatter={(value: number) => `$${value.toLocaleString()}`}
            labelFormatter={(value) => new Date(`${value}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          />
          <Legend />
          <Bar dataKey="newMRR" stackId="a" fill="#22c55e" name="New" />
          <Bar dataKey="expansionMRR" stackId="a" fill="#0ea5e9" name="Expansion" />
          <Bar dataKey="churnMRR" stackId="b" fill="#ef4444" name="Churn" />
          <Bar dataKey="contractionMRR" stackId="b" fill="#f97316" name="Contraction" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
