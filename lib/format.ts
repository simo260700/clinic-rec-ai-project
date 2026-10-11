// All formatting is pinned to the clinic's timezone and a fixed locale so
// server and client render identical strings.
const TIME_ZONE = "Europe/Rome";
const LOCALE = "en-GB";

const timeFmt = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE });
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: TIME_ZONE });
const shortDateFmt = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", timeZone: TIME_ZONE });
const longDateFmt = new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TIME_ZONE });
const fullDateFmt = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", year: "numeric", timeZone: TIME_ZONE });

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

function dayKey(iso: string): string {
  return dayKeyFmt.format(new Date(iso));
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(dayKey(fromIso));
  const to = Date.parse(dayKey(toIso));
  return Math.round((to - from) / 86_400_000);
}

/** Inbox timestamp: "15:53", "Yesterday" or "8 Oct". */
export function formatListTimestamp(iso: string, nowIso: string): string {
  const diff = daysBetween(iso, nowIso);
  if (diff <= 0) return formatTime(iso);
  if (diff === 1) return "Yesterday";
  return shortDateFmt.format(new Date(iso));
}

/** Chat day separator: "Today", "Yesterday" or "Thursday, 8 October 2026". */
export function formatDayLabel(iso: string, nowIso: string): string {
  const diff = daysBetween(iso, nowIso);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return longDateFmt.format(new Date(iso));
}

export function isSameDay(a: string, b: string): boolean {
  return dayKey(a) === dayKey(b);
}

/** "14 October 2026 at 09:30" */
export function formatAppointment(iso: string): string {
  return `${fullDateFmt.format(new Date(iso))} at ${formatTime(iso)}`;
}

export function formatLongDate(iso: string): string {
  return longDateFmt.format(new Date(iso));
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
