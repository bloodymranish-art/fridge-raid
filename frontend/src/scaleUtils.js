// Turns a decimal amount into "1", "1/2", "1 1/3" etc for common cooking
// fractions, instead of printing "0.3333333333333333 cup".

const COMMON_FRACTIONS = [
  { value: 1 / 8, label: "1/8" },
  { value: 1 / 4, label: "1/4" },
  { value: 1 / 3, label: "1/3" },
  { value: 1 / 2, label: "1/2" },
  { value: 2 / 3, label: "2/3" },
  { value: 3 / 4, label: "3/4" },
];

export function formatAmount(amount) {
  if (amount == null || !Number.isFinite(amount)) return null;

  const whole = Math.floor(amount);
  const remainder = amount - whole;

  if (remainder < 0.03) {
    return whole === 0 ? "0" : String(whole);
  }

  let closest = COMMON_FRACTIONS[0];
  let closestDiff = Math.abs(remainder - closest.value);
  for (const frac of COMMON_FRACTIONS) {
    const diff = Math.abs(remainder - frac.value);
    if (diff < closestDiff) {
      closest = frac;
      closestDiff = diff;
    }
  }

  // Close enough to a whole number after rounding up.
  if (closestDiff > 0.08 && remainder > 0.92) {
    return String(whole + 1);
  }

  if (closestDiff > 0.08) {
    // Not near a common fraction — just show one decimal place.
    return String(Math.round(amount * 10) / 10);
  }

  return whole > 0 ? `${whole} ${closest.label}` : closest.label;
}

export function scaleAmount(amount, originalServings, targetServings) {
  if (amount == null || !originalServings) return amount;
  return (amount / originalServings) * targetServings;
}
