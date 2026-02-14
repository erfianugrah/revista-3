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
 * Format a Date into "Mon DD, YYYY" style (e.g. "Jan 15, 2025"),
 * dropping the weekday from toDateString().
 * Returns undefined if the input is nullish.
 */
export function formatDate(date: Date | undefined | null): string | undefined {
  return date?.toDateString().split(" ").slice(1).join(" ");
}
