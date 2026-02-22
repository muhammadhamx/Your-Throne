import type { Session } from '@/types/database';
import {
  HEALTHY_DURATION_MAX_SECONDS,
  HEALTHY_DURATION_MIN_SECONDS,
  HEALTHY_FREQUENCY_MAX_PER_DAY,
} from '@/utils/constants';

export type HealthStatus = 'green' | 'yellow' | 'red';

export interface HealthInsight {
  status: HealthStatus;
  title: string;
  message: string;
  emoji: string;
}

/**
 * Analyze session patterns and return health insights.
 * All thresholds are rough guidelines — always show a disclaimer.
 */
export function analyzeHealth(sessions: Session[]): HealthInsight[] {
  const completed = sessions.filter(
    (s) => s.duration_seconds !== null && s.ended_at
  );
  if (completed.length < 3) return [];

  const insights: HealthInsight[] = [];

  // --- Duration analysis ---
  const durations = completed.map((s) => s.duration_seconds!);
  const avgDuration =
    durations.reduce((a, b) => a + b, 0) / durations.length;

  // Recent vs overall trend
  const recentSessions = completed.slice(0, 7);
  const recentAvg =
    recentSessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0) /
    recentSessions.length;

  if (avgDuration > HEALTHY_DURATION_MAX_SECONDS) {
    insights.push({
      status: 'yellow',
      title: 'Long Sessions',
      message:
        'Your average session is over 15 minutes. Consider more fiber in your diet and less phone time on the throne.',
      emoji: '⏱️',
    });
  }

  if (recentAvg > avgDuration * 1.4 && completed.length > 7) {
    insights.push({
      status: 'yellow',
      title: 'Sessions Getting Longer',
      message: `Your recent sessions are ${Math.round(
        ((recentAvg - avgDuration) / avgDuration) * 100
      )}% longer than your average. Keep an eye on this.`,
      emoji: '📈',
    });
  }

  // Very short and very frequent
  const shortFrequent =
    avgDuration < HEALTHY_DURATION_MIN_SECONDS &&
    getRecentFrequency(completed, 7) > HEALTHY_FREQUENCY_MAX_PER_DAY;

  if (shortFrequent) {
    insights.push({
      status: 'yellow',
      title: 'Frequent Short Sessions',
      message:
        'Very frequent, short sessions could indicate digestive sensitivity. If it persists, consider consulting a doctor.',
      emoji: '⚡',
    });
  }

  // --- Frequency analysis ---
  const weeklyFreq = getRecentFrequency(completed, 7);
  const overallFreq = getRecentFrequency(completed, 30);

  if (weeklyFreq > overallFreq * 1.5 && completed.length > 14) {
    insights.push({
      status: 'yellow',
      title: 'Increased Frequency',
      message: `You've been going ${weeklyFreq.toFixed(
        1
      )}x/day this week vs your usual ${overallFreq.toFixed(
        1
      )}x. Could be diet-related.`,
      emoji: '📊',
    });
  }

  // If nothing flagged, all green
  if (insights.length === 0) {
    insights.push({
      status: 'green',
      title: 'Looking Good!',
      message:
        'Your patterns look healthy. Keep doing what you\'re doing!',
      emoji: '✅',
    });
  }

  return insights;
}

/**
 * Get the overall health status (worst of all insights).
 */
export function getOverallStatus(insights: HealthInsight[]): HealthStatus {
  if (insights.some((i) => i.status === 'red')) return 'red';
  if (insights.some((i) => i.status === 'yellow')) return 'yellow';
  return 'green';
}

/**
 * Calculate average sessions per day over the last N days.
 */
function getRecentFrequency(sessions: Session[], days: number): number {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const recent = sessions.filter(
    (s) => new Date(s.started_at) >= cutoff
  );
  return recent.length / days;
}

export const HEALTH_DISCLAIMER =
  'This is for fun, not a diagnosis. See a real doctor for real concerns.';
