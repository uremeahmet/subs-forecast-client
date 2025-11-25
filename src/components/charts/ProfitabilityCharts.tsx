'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TimeseriesPoint } from '@/lib/types';
import { formatCompactCurrency } from '@/lib/format';

interface ProfitabilityChartsProps {
  timeseries: TimeseriesPoint[];
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }).format(
    new Date(`${iso}-01`)
  );

export const ProfitabilityCharts = ({ timeseries }: ProfitabilityChartsProps) => {
  const data = timeseries.map((entry) => {
    const totalExpenses =
      entry.totals.salesMarketingExpense +
      entry.totals.sharedExpenses +
      (entry.totals.fees ?? 0) +
      (entry.totals.failedCharges ?? 0) +
      (entry.totals.refunds ?? 0);

    return {
      date: entry.date,
      revenue: entry.totals.grossRevenue,
      netRevenue: entry.totals.netRevenue,
      cogs: entry.totals.cogs,
      totalExpenses,
      totalExpensesNegative: -totalExpenses,
      salesMarketing: entry.totals.salesMarketingExpense,
      sharedExpenses: entry.totals.sharedExpenses,
      otherExpenses:
        (entry.totals.fees ?? 0) + (entry.totals.failedCharges ?? 0) + (entry.totals.refunds ?? 0),
      vat: entry.totals.vat,
      tax: entry.totals.corporateIncomeTax,
      profit: entry.totals.profit,
    };
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-blue-300">Revenue vs Expenses</p>
            <h3 className="text-xl font-semibold text-white">Gross Revenue vs Total Expenses</h3>
          </div>
        </div>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 0, right: 20, top: 10, bottom: 0 }} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#94a3b8" tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                tickFormatter={(value) => formatCompactCurrency(value).replace('.0', '')}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(148,163,184,0.2)' }}
                labelFormatter={(value) => formatDate(value as string)}
                formatter={(value: number, name) => [
                  formatCompactCurrency(name === 'Total Expenses' ? Math.abs(value) : value),
                  name,
                ]}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#1e293b" strokeDasharray="4 4" />
              <Bar dataKey="revenue" name="Gross Revenue" fill="#6366f1" stackId="profit" radius={[6, 6, 0, 0]} />
              <Bar
                dataKey="totalExpensesNegative"
                name="Total Expenses"
                fill="#f97316"
                stackId="profit"
                radius={[0, 0, 6, 6]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-blue-300">COGS Trend</p>
              <h3 className="text-xl font-semibold text-white">Cost of Goods Sold</h3>
            </div>
          </div>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                <XAxis dataKey="date" tickFormatter={formatDate} stroke="#94a3b8" tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  tickFormatter={(value) => formatCompactCurrency(value).replace('.0', '')}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(148,163,184,0.2)',
                  }}
                  labelFormatter={(value) => formatDate(value as string)}
                  formatter={(value: number) => formatCompactCurrency(value)}
                />
                <Area type="monotone" dataKey="cogs" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-blue-300">Expenses Breakdown</p>
              <h3 className="text-xl font-semibold text-white">Operating Expenses</h3>
            </div>
          </div>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tickFormatter={formatDate} stroke="#94a3b8" tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  tickFormatter={(value) => formatCompactCurrency(value).replace('.0', '')}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(148,163,184,0.2)',
                  }}
                  labelFormatter={(value) => formatDate(value as string)}
                  formatter={(value: number, name) => [formatCompactCurrency(value), name]}
                />
                <Legend />
                <Bar dataKey="salesMarketing" stackId="expenses" fill="#3b82f6" name="Sales & Marketing" />
                <Bar dataKey="sharedExpenses" stackId="expenses" fill="#facc15" name="Shared Expenses" />
                <Bar dataKey="otherExpenses" stackId="expenses" fill="#14b8a6" name="Fees + Other" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-blue-300">P&L Overview</p>
            <h3 className="text-xl font-semibold text-white">Net Revenue, VAT, Tax & Profit</h3>
          </div>
        </div>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#94a3b8" tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                tickFormatter={(value) => formatCompactCurrency(value).replace('.0', '')}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(148,163,184,0.2)',
                }}
                labelFormatter={(value) => formatDate(value as string)}
                formatter={(value: number, name) => [formatCompactCurrency(value), name]}
              />
              <Legend />
              <Bar dataKey="netRevenue" fill="#22c55e" name="Net Revenue" />
              <Bar dataKey="vat" fill="#f97316" name="VAT" />
              <Bar dataKey="tax" fill="#ef4444" name="Corporate Tax" />
              <Bar dataKey="profit" fill="#6366f1" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

