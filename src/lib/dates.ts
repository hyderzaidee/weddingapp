const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function parseYmd(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const year = match[1]!;
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (!Number.isFinite(day) || monthIndex < 0 || monthIndex > 11) return null;
  return { year, monthIndex, day };
}

/** Deterministic date label (avoids SSR/client locale mismatches). */
export function formatEventDate(value: string | null | undefined): string {
  if (!value) return "Date TBD";
  const parts = parseYmd(value);
  if (!parts) return value;
  return `${parts.day} ${MONTHS_SHORT[parts.monthIndex]} ${parts.year}`;
}

export function formatEventDateLong(value: string | null | undefined): string {
  if (!value) return "—";
  const parts = parseYmd(value);
  if (!parts) return value;
  return `${parts.day} ${MONTHS_LONG[parts.monthIndex]} ${parts.year}`;
}
