import type { Translations } from "@opengnothia/shared/i18n";

/**
 * Calendar helpers lifted from desktop's JournalPage/DreamsPage — each of
 * those carries a private copy; the two Defter segments share this one.
 * Weeks start on Monday, matching getDayNames().
 */
export function getCalendarDays(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const startDow = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1;

  const days: Date[] = [];

  for (let i = startDow - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  while (days.length % 7 !== 0) {
    const nextDay = days.length - startDow - lastOfMonth.getDate() + 1;
    days.push(new Date(year, month + 1, nextDay));
  }

  return days;
}

export function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatMonthYear(year: number, month: number, locale: string): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

/** "2026-08-18" → the device-locale long form used as a composer/detail title. */
export function formatDayLabel(ymd: string, locale: string): string {
  return new Date(ymd + "T00:00:00").toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * SQLite's CURRENT_TIMESTAMP is "YYYY-MM-DD HH:MM:SS" in UTC. Desktop just
 * appends "Z" and relies on the WebView's lenient parser; Hermes only parses
 * ISO 8601, so the space must become a "T" as well.
 */
function toIsoUtc(sqliteTimestamp: string): string {
  if (sqliteTimestamp.includes("T")) return sqliteTimestamp;
  return sqliteTimestamp.replace(" ", "T") + "Z";
}

export function formatTimestamp(sqliteTimestamp: string, locale: string): string {
  return new Date(toIsoUtc(sqliteTimestamp)).toLocaleString(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(sqliteTimestamp: string, t: Translations["common"], locale: string): string {
  const date = new Date(toIsoUtc(sqliteTimestamp));
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t.justNow;
  if (diffMins < 60) return `${diffMins} ${t.minutesAgo}`;
  if (diffHours < 24) return `${diffHours} ${t.hoursAgo}`;
  if (diffDays < 7) return `${diffDays} ${t.daysAgo}`;
  return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
}
