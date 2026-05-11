/** Safely parse a (potentially comma-formatted) numeric string. */
export function numericAmount(amount?: string): number {
  if (!amount) return 0;
  const parsed = Number(amount.replaceAll(",", ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
