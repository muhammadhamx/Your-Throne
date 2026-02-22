import type { Session } from './database';

export interface ActiveSession {
  isActive: boolean;
  startTime: number | null; // timestamp ms
  elapsedSeconds: number;
  sessionId: string | null; // DB id once inserted
}

export interface SessionSummary {
  duration: number;
  rating: number | null;
  notes: string | null;
  funnyMessage: string;
}

export type SessionWithMeta = Session & {
  dayOfWeek: number;
  hourOfDay: number;
};
