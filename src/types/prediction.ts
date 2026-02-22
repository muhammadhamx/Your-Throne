export interface PredictionResult {
  predictedTime: Date;
  confidence: number; // 0-1
  dayOfWeek: number;
  bucket: number;
}

export interface PatternInsight {
  type: 'peak_times' | 'weekend_vs_weekday' | 'regularity' | 'trend';
  message: string;
}

export interface PredictionModel {
  // 7 days x 96 buckets (15-minute intervals per day)
  histogram: number[][];
  dailyFrequency: number[]; // avg sessions per day-of-week
  lastUpdated: number;
  totalSessions: number;
}
