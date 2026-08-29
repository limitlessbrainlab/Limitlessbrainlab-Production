export const formatCurrency = (amount, currency = 'INR') => {
  const code = String(currency || 'INR').toUpperCase();
  const value = Number(amount) || 0;

  // USD renders as literal "USD" text rather than the '$' symbol per client
  // requirement (other currencies keep their own symbol).
  if (code === 'USD') {
    return `USD ${value.toFixed(2)}`;
  }

  const locale = code === 'INR' ? 'en-IN' : 'en-US';
  const fractionDigits = code === 'INR' ? 0 : 2;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
};
