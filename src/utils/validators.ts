import {
  MIN_SESSION_DURATION_SECONDS,
  MAX_SESSION_DURATION_SECONDS,
  MAX_MESSAGE_LENGTH,
  MAX_NOTES_LENGTH,
} from './constants';

export function isValidDuration(seconds: number): boolean {
  return (
    Number.isInteger(seconds) &&
    seconds >= MIN_SESSION_DURATION_SECONDS &&
    seconds <= MAX_SESSION_DURATION_SECONDS
  );
}

export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

export function isValidMessage(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH;
}

export function isValidNotes(notes: string): boolean {
  return notes.length <= MAX_NOTES_LENGTH;
}

export function isValidDisplayName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 30;
}
