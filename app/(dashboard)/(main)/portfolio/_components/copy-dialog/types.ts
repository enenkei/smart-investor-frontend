export const normalizePct = (val: number | undefined | null): number => {
  if (val == null || isNaN(val)) return 0;
  // If absolute value is <= 1.0 (e.g. 0.5234 or 0.1424), convert to percentage (52.34 or 14.24).
  // If absolute value is > 1.0 (e.g. 52.339 or 14.2368), it is already expressed in percent.
  return Math.abs(val) <= 1.0 ? val * 100 : val;
};

export const formatPct = (val: number | undefined | null): string => {
  return `${normalizePct(val).toFixed(2)}%`;
};

export const formatCurrency = (val: number | undefined | null): string => {
  if (val == null || isNaN(val)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};
