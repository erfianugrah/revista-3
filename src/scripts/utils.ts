/**
 * Fisher-Yates shuffle — returns a new shuffled copy of the array.
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Format a reading time given in milliseconds into "Xm Ys Zms" style
 * (e.g. "3m 12s 480ms"). Minutes are omitted when zero.
 */
export function formatReadingTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const remainingMs = ms % 1000;
  const parts: string[] = [];
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  parts.push(`${remainingMs}ms`);
  return parts.join(" ");
}

/**
 * Format a Date into "Mon DD, YYYY HH:MM:SS.mmm" style
 * (e.g. "Jan 15, 2025 14:30:05.123"), showing time down to milliseconds.
 * Returns undefined if the input is nullish.
 */
export function formatDate(date: Date | undefined | null): string | undefined {
  if (!date) return undefined;
  const datePart = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ms = String(date.getMilliseconds()).padStart(3, "0");
  return `${datePart} ${hours}:${minutes}:${seconds}.${ms}`;
}
