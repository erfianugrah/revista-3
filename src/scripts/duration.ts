/**
 * Shared duration analysis for CV timeline components.
 * Parses date ranges (string or structured) and returns
 * duration metadata for color coding and scaling.
 */

export interface DurationAnalysis {
  /** CSS scale factor (0.5–4) proportional to duration */
  scale?: number;
  /** Color category: short | medium | long | very-long */
  colorCategory: string;
  /** Duration in fractional years */
  durationYears: number;
  /** Formatted display string, e.g. "Jul 2019 – Dec 2020" */
  displayDateRange: string;
}

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];
const MONTHS_DISPLAY = [
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
];

function getMonthIndex(month: string): number {
  return MONTHS.findIndex((m) =>
    month.toLowerCase().startsWith(m.toLowerCase()),
  );
}

function formatDate(date: Date): string {
  return `${MONTHS_DISPLAY[date.getMonth()]} ${date.getFullYear()}`;
}

interface DurationThresholds {
  short: number;
  medium: number;
  long: number;
}

/**
 * Analyze a date range and return duration metadata.
 *
 * @param dateRange - Either a human-readable string like "July 2019 – Dec 2020"
 *                    or a structured object { start: "2019-07", end?: "2020-12" }
 * @param thresholds - Year breakpoints for color categories
 * @param includeScale - Whether to compute the scale factor (used by Timeline, not EducationTimeline)
 */
export function analyzeDuration(
  dateRange: string | { start: string; end?: string },
  thresholds: DurationThresholds = { short: 0.75, medium: 2, long: 4 },
  includeScale = false,
): DurationAnalysis {
  let startDate: Date;
  let endDate: Date = new Date();
  let displayDateRange: string;

  if (typeof dateRange === "string") {
    displayDateRange = dateRange;

    const monthYearPattern =
      /(\w+)\s+(\d{4})\s*[–-]\s*(?:Present|(\w+)\s+(\d{4}))/i;
    const matches = dateRange.match(monthYearPattern);

    if (matches) {
      const startYear = parseInt(matches[2]);
      const endYear = matches[4]
        ? parseInt(matches[4])
        : new Date().getFullYear();
      const startMonth = getMonthIndex(matches[1]);
      const endMonth = matches[3]
        ? getMonthIndex(matches[3])
        : new Date().getMonth();

      startDate = new Date(startYear, startMonth, 1);
      endDate = new Date(endYear, endMonth, 1);
    } else {
      return {
        ...(includeScale ? { scale: 1 } : {}),
        colorCategory: "medium",
        durationYears: 1,
        displayDateRange,
      };
    }
  } else {
    const { start, end } = dateRange;
    const [startYear, startMonth] = start.split("-").map((n) => parseInt(n));
    startDate = new Date(startYear, startMonth - 1, 1);

    if (end && end !== "Present") {
      const [endYear, endMonth] = end.split("-").map((n) => parseInt(n));
      endDate = new Date(endYear, endMonth - 1, 1);
    } else {
      endDate = new Date();
    }

    displayDateRange = `${formatDate(startDate)} – ${end === "Present" ? "Present" : formatDate(endDate)}`;
  }

  const durationYears =
    endDate.getFullYear() -
    startDate.getFullYear() +
    (endDate.getMonth() - startDate.getMonth()) / 12;

  let colorCategory: string;
  if (durationYears < thresholds.short) {
    colorCategory = "short";
  } else if (durationYears < thresholds.medium) {
    colorCategory = "medium";
  } else if (durationYears < thresholds.long) {
    colorCategory = "long";
  } else {
    colorCategory = "very-long";
  }

  const result: DurationAnalysis = {
    colorCategory,
    durationYears,
    displayDateRange,
  };

  if (includeScale) {
    result.scale = Math.max(0.5, Math.min(4, durationYears / 1.2));
  }

  return result;
}
