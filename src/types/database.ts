// TypeScript types matching the Supabase database schema

export interface Profile {
  id: string;
  display_name: string;
  avatar_emoji: string;
  is_in_session: boolean;
  session_started_at: string | null;
  looking_for_buddy: boolean;
  xp: number;
  streak_count: number;
  streak_last_date: string;
  streak_freezes: number;
  selected_title_id: string;
  unlocked_title_ids: string[];
  unlocked_achievement_ids: string[];
  reward_session_count: number;
  credits: number;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: 'xp_convert' | 'buddy_match' | 'buddy_chat_unlock';
  metadata: Record<string, any>;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  is_quick_log: boolean;
  notes: string | null;
  rating: number | null;
  created_at: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  max_participants: number;
  created_at: string;
}

export interface ChatRoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
}

export interface BuddyMatch {
  id: string;
  user_a: string;
  user_b: string;
  status: 'active' | 'ended';
  created_at: string;
  ended_at: string | null;
}

export interface Message {
  id: string;
  room_id: string | null;
  match_id: string | null;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface League {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  join_code: string;
  created_by: string;
  created_at: string;
}

export interface LeagueMember {
  id: string;
  league_id: string;
  user_id: string;
  joined_at: string;
}

export interface LeagueLeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  total_xp: number;
  weekly_xp: number;
}

export interface GlobalLeagueEntry {
  league_id: string;
  name: string;
  emoji: string;
  member_count: number;
  total_weekly_xp: number;
}

export interface WeeklyLeagueResult {
  id: string;
  week_start: string;
  week_end: string;
  winning_league_id: string | null;
  winning_league_name: string;
  winning_league_emoji: string;
  winning_league_total_xp: number;
  league_rankings: Array<{
    league_id: string;
    name: string;
    emoji: string;
    member_count: number;
    total_weekly_xp: number;
  }>;
  winning_members: Array<{
    user_id: string;
    display_name: string;
    avatar_emoji: string;
    weekly_xp: number;
  }>;
  created_at: string;
}

export interface ChampionNote {
  id: string;
  weekly_result_id: string;
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  note: string;
  created_at: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: 'functional' | 'title' | 'border' | 'fun';
  price: number;
  emoji: string;
  is_repeatable: boolean;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ShopPurchase {
  id: string;
  user_id: string;
  item_id: string;
  credits_spent: number;
  created_at: string;
}

// Supabase Database type helper
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id' | 'created_at'>;
        Update: Partial<Omit<Session, 'id' | 'user_id' | 'created_at'>>;
      };
      chat_rooms: {
        Row: ChatRoom;
        Insert: Omit<ChatRoom, 'id' | 'created_at'>;
        Update: Partial<Omit<ChatRoom, 'id' | 'created_at'>>;
      };
      chat_room_participants: {
        Row: ChatRoomParticipant;
        Insert: Omit<ChatRoomParticipant, 'id'>;
        Update: Partial<Omit<ChatRoomParticipant, 'id'>>;
      };
      buddy_matches: {
        Row: BuddyMatch;
        Insert: Omit<BuddyMatch, 'id' | 'created_at'>;
        Update: Partial<Omit<BuddyMatch, 'id' | 'created_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Omit<Message, 'id' | 'created_at'>>;
      };
    };
    Functions: {
      get_user_stats: {
        Args: { p_user_id: string };
        Returns: UserStats;
      };
      create_buddy_match: {
        Args: { p_user_a: string; p_user_b: string };
        Returns: BuddyMatch | null;
      };
    };
  };
}

export interface UserStats {
  total_sessions: number;
  total_duration: number;
  avg_duration: number;
  longest_session: number;
  first_session: string | null;
  hourly_distribution: Array<{ hour: number; count: number }> | null;
}
