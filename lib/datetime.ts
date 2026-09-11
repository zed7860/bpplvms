// Central helper for displaying all visitor timestamps in Indian Standard Time (Asia/Kolkata / Bangalore).
const IST_TIME_ZONE = "Asia/Kolkata";

function toDate(input: string | Date): Date {
  return typeof input === "string" ? new Date(input) : input;
}

export function formatISTDate(input: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: IST_TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric" }).format(toDate(input)).replace(/\//g, "-");
}

export function formatISTTime12(input: string | Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: IST_TIME_ZONE, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).format(toDate(input));
}

export function formatISTTime24(input: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: IST_TIME_ZONE, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(toDate(input));
}

/** e.g. "08-09-2026, 02:35:10 PM (14:35:10 IST)" */
export function formatISTDateTime(input: string | Date): string {
  return `${formatISTDate(input)}, ${formatISTTime12(input)} (${formatISTTime24(input)} IST)`;
}

/** Today's calendar date in IST as YYYY-MM-DD, for use as an <input type="date"> value. */
export function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: IST_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** Converts an IST calendar date (YYYY-MM-DD) into a UTC ISO instant at IST midnight/day-end. */
export function istDateBoundary(date: string, end: boolean): string {
  return new Date(`${date}T${end ? "23:59:59.999" : "00:00:00.000"}+05:30`).toISOString();
}
