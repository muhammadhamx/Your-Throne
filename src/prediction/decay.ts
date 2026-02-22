import { DECAY_LAMBDA } from '@/utils/constants';

/**
 * Compute exponential decay weight for a session that occurred `daysAgo` days in the past.
 * More recent sessions get higher weight.
 *
 * With DECAY_LAMBDA = 0.95:
 * - Today: weight = 1.0
 * - 7 days ago: weight = 0.70
 * - 14 days ago: weight = 0.49
 * - 30 days ago: weight = 0.21
 */
export function decayWeight(daysAgo: number): number {
  return Math.pow(DECAY_LAMBDA, daysAgo);
}

/**
 * Compute the half-life in days for the current decay lambda.
 * This is how many days until a session's weight drops to 50%.
 */
export function halfLife(): number {
  return Math.log(0.5) / Math.log(DECAY_LAMBDA);
}
