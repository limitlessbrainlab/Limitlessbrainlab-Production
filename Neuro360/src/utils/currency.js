export const formatCurrency = (amount, currency = 'INR') => {
  const code = String(currency || 'INR').toUpperCase();
  const value = Number(amount) || 0;
  const locale = code === 'INR' ? 'en-IN' : 'en-US';
  const fractionDigits = code === 'INR' ? 0 : 2;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
};
