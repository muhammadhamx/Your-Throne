import type { Message, BuddyMatch, ChatRoom } from './database';

export interface ChatRoomWithCount extends ChatRoom {
  participantCount: number;
}

export interface ChatMessage extends Message {
  senderName: string;
  senderEmoji: string;
  isOwn: boolean;
}

export interface MatchmakingState {
  isSearching: boolean;
  searchStartedAt: number | null;
  currentMatch: BuddyMatch | null;
}

export interface PresenceUser {
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  is_in_session: boolean;
  joined_at: number;
}
