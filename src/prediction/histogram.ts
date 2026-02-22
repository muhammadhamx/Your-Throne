import type { Session } from '@/types/database';
import { DECAY_LAMBDA, HISTOGRAM_BUCKETS_PER_DAY } from '@/utils/constants';

/**
 * Build a 7-day x 96-bucket histogram of session start times,
 * weighted by recency using exponential decay.
 */
export function buildHistogram(sessions: Session[]): number[][] {
  const histogram: number[][] = Array.from({ length: 7 }, () =>
    new Array(HISTOGRAM_BUCKETS_PER_DAY).fill(0)
  );

  const now = Date.now();

  for (const session of sessions) {
    if (!session.ended_at) continue;

    const start = new Date(session.started_at);
    const dayOfWeek = start.getDay(); // 0=Sun, 6=Sat
    const minuteOfDay = start.getHours() * 60 + start.getMinutes();
    const bucket = Math.floor(minuteOfDay / 15);

    // Days ago (for decay weighting)
    const daysAgo = (now - start.getTime()) / (1000 * 60 * 60 * 24);
    const weight = Math.pow(DECAY_LAMBDA, daysAgo);

    // Primary bucket
    histogram[dayOfWeek][bucket] += weight * 1.0;

    // Gaussian smoothing to adjacent buckets
    if (bucket > 0) {
      histogram[dayOfWeek][bucket - 1] += weight * 0.3;
    }
    if (bucket < HISTOGRAM_BUCKETS_PER_DAY - 1) {
      histogram[dayOfWeek][bucket + 1] += weight * 0.3;
    }
  }

  return histogram;
}

/**
 * Compute average daily frequency by day of week.
 */
export function computeDailyFrequency(sessions: Session[]): number[] {
  const dayCounts = new Array(7).fill(0);
  const weeksSeen = new Set<string>();

  for (const session of sessions) {
    if (!session.ended_at) continue;
    const start = new Date(session.started_at);
    const dayOfWeek = start.getDay();
    dayCounts[dayOfWeek]++;

    // Track unique weeks
    const weekKey = `${start.getFullYear()}-W${Math.ceil(
      (start.getTime() - new Date(start.getFullYear(), 0, 1).getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    )}`;
    weeksSeen.add(weekKey);
  }

  const totalWeeks = Math.max(weeksSeen.size, 1);
  return dayCounts.map((count) => count / totalWeeks);
}
