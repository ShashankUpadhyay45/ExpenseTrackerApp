export const formatCurrency = (amount: number, currency?: string) => {
  const currentCurrency = currency || localStorage.getItem('spendsage-currency') || 'INR';
  const locale = currentCurrency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currentCurrency,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

export const formatPercentage = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format((value || 0) / 100);
};

export const abbreviateNumber = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value || 0);
};
