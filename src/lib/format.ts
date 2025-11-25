const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
});

export const formatCurrency = (value: number) => currencyFormatter.format(value || 0);
export const formatCompactCurrency = (value: number) =>
  compactCurrencyFormatter.format(value || 0);
export const formatNumber = (value: number) => numberFormatter.format(value || 0);
export const formatPercent = (value: number) => percentFormatter.format(value || 0);

export const computeDelta = (current: number, previous: number) => {
  if (!previous) {
    return 0;
  }
  return (current - previous) / previous;
};
