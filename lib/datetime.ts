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
