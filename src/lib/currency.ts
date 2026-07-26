/** Change this to switch currency display app-wide (e.g. "$", "£", "€"). */
export const CURRENCY_SYMBOL = "Rs";

export function formatCurrency(amount: number): string {
  const absolute = Math.abs(amount).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const sign = amount < 0 ? "-" : "";
  return `${sign}${CURRENCY_SYMBOL} ${absolute}`;
}

export function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
