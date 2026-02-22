import type { Session } from '@/types/database';
import type { PredictionResult, PatternInsight, PredictionModel } from '@/types/prediction';
import { buildHistogram, computeDailyFrequency } from './histogram';
import { HISTOGRAM_BUCKETS_PER_DAY } from '@/utils/constants';
import { formatHour } from '@/utils/formatters';

/**
 * Build the full prediction model from session history.
 */
export function buildModel(sessions: Session[]): PredictionModel {
  const completed = sessions.filter((s) => s.ended_at);
  return {
    histogram: buildHistogram(completed),
    dailyFrequency: computeDailyFrequency(completed),
    lastUpdated: Date.now(),
    totalSessions: completed.length,
  };
}

/**
 * Predict the next session time based on the histogram.
 * Searches forward from the current time through the next 7 days.
 */
export function predictNextSession(
  model: PredictionModel,
  now: Date = new Date()
): PredictionResult | null {
  const { histogram } = model;
  if (model.totalSessions < 3) return null;

  const currentDay = now.getDay();
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  const currentBucket = Math.floor(currentMinute / 15);

  let bestScore = 0;
  let bestDay = currentDay;
  let bestBucket = currentBucket;
  let bestDayOffset = 0;

  // Search forward through time
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const day = (currentDay + dayOffset) % 7;
    const startBucket = dayOffset === 0 ? currentBucket + 1 : 0;

    for (let bucket = startBucket; bucket < HISTOGRAM_BUCKETS_PER_DAY; bucket++) {
      if (histogram[day][bucket] > bestScore) {
        bestScore = histogram[day][bucket];
        bestDay = day;
        bestBucket = bucket;
        bestDayOffset = dayOffset;
      }
    }

    // If we found a strong peak today or tomorrow, prioritize it
    if (bestScore > 0 && dayOffset >= 1) break;
  }

  if (bestScore === 0) return null;

  // Convert back to Date
  const predictedDate = new Date(now);
  predictedDate.setDate(predictedDate.getDate() + bestDayOffset);
  predictedDate.setHours(Math.floor((bestBucket * 15) / 60));
  predictedDate.setMinutes((bestBucket * 15) % 60);
  predictedDate.setSeconds(0);
  predictedDate.setMilliseconds(0);

  // Confidence calculation
  const totalWeight = histogram.flat().reduce((a, b) => a + b, 0);
  const avgWeight = totalWeight / (7 * HISTOGRAM_BUCKETS_PER_DAY);
  const confidence =
    totalWeight > 0
      ? Math.min(bestScore / (avgWeight * 3), 1.0)
      : 0;

  return {
    predictedTime: predictedDate,
    confidence,
    dayOfWeek: bestDay,
    bucket: bestBucket,
  };
}

/**
 * Generate human-readable pattern insights.
 */
export function getInsights(model: PredictionModel): PatternInsight[] {
  const { histogram, dailyFrequency } = model;
  const insights: PatternInsight[] = [];

  if (model.totalSessions < 5) return insights;

  // Find peak hours
  const hourlyTotals = new Array(24).fill(0);
  for (let day = 0; day < 7; day++) {
    for (let bucket = 0; bucket < HISTOGRAM_BUCKETS_PER_DAY; bucket++) {
      hourlyTotals[Math.floor(bucket / 4)] += histogram[day][bucket];
    }
  }

  const peakHours = hourlyTotals
    .map((val, hour) => ({ hour, val }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 3)
    .filter((h) => h.val > 0);

  if (peakHours.length > 0) {
    const times = peakHours.map((h) => formatHour(h.hour)).join(', ');
    insights.push({
      type: 'peak_times',
      message: `Your most common times are ${times}`,
    });
  }

  // Weekend vs weekday comparison
  const weekdayAvg =
    dailyFrequency.slice(1, 6).reduce((a, b) => a + b, 0) / 5;
  const weekendAvg =
    (dailyFrequency[0] + dailyFrequency[6]) / 2;

  if (weekendAvg > weekdayAvg * 1.3) {
    insights.push({
      type: 'weekend_vs_weekday',
      message: 'You tend to have more sessions on weekends',
    });
  } else if (weekdayAvg > weekendAvg * 1.3) {
    insights.push({
      type: 'weekend_vs_weekday',
      message: 'You tend to go more on weekdays',
    });
  }

  // Regularity check
  const peakBuckets = histogram.flat().filter((v) => v > 0.5);
  if (peakBuckets.length <= 5 && peakBuckets.length > 0) {
    insights.push({
      type: 'regularity',
      message: 'Your schedule is very regular — your gut runs like clockwork!',
    });
  }

  return insights;
}
