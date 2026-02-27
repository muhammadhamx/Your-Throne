import { supabase } from './supabase';
import type { Session, Profile, ChatRoom, Message, BuddyMatch, League, LeagueLeaderboardEntry } from '@/types/database';

// ============ SESSIONS ============

export async function insertSession(
  userId: string,
  startedAt: string,
  isQuickLog = false
): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      started_at: startedAt,
      is_quick_log: isQuickLog,
      ended_at: null,
      duration_seconds: null,
      notes: null,
      rating: null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function endSession(
  sessionId: string,
  endedAt: string,
  durationSeconds: number
): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .update({
      ended_at: endedAt,
      duration_seconds: durationSeconds,
    })
    .eq('id', sessionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSessionMeta(
  sessionId: string,
  updates: { rating?: number; notes?: string }
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', sessionId);
  if (error) throw error;
}

export async function quickLogSession(
  userId: string,
  startedAt: string,
  durationSeconds: number,
  notes?: string
): Promise<Session> {
  const endedAt = new Date(
    new Date(startedAt).getTime() + durationSeconds * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      started_at: startedAt,
      ended_at: endedAt,
      duration_seconds: durationSeconds,
      is_quick_log: true,
      notes: notes || null,
      rating: null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserSessions(
  userId: string,
  limit = 50,
  offset = 0
): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data;
}

export async function getSessionsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .gte('started_at', startDate)
    .lte('started_at', endDate)
    .order('started_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId);
  if (error) throw error;
}

// ============ PROFILES ============

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'display_name' | 'avatar_emoji' | 'is_in_session' | 'session_started_at' | 'looking_for_buddy' | 'xp' | 'streak_count' | 'streak_last_date' | 'streak_freezes' | 'selected_title_id' | 'unlocked_title_ids' | 'unlocked_achievement_ids' | 'reward_session_count'>>
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

/** Full gamification data shape for sync */
export interface GamificationSyncData {
  xp: number;
  streakCount: number;
  streakLastDate: string;
  streakFreezes: number;
  selectedTitleId: string;
  unlockedTitleIds: string[];
  unlockedAchievementIds: string[];
  rewardSessionCount: number;
}

/** Push local gamification state to Supabase profile */
export async function syncGamificationUp(
  userId: string,
  data: GamificationSyncData
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      xp: data.xp,
      streak_count: data.streakCount,
      streak_last_date: data.streakLastDate,
      streak_freezes: data.streakFreezes,
      selected_title_id: data.selectedTitleId,
      unlocked_title_ids: data.unlockedTitleIds,
      unlocked_achievement_ids: data.unlockedAchievementIds,
      reward_session_count: data.rewardSessionCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (error) throw error;
}

/** Pull gamification data from Supabase profile */
export async function syncGamificationDown(
  userId: string
): Promise<GamificationSyncData | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('xp, streak_count, streak_last_date, streak_freezes, selected_title_id, unlocked_title_ids, unlocked_achievement_ids, reward_session_count')
    .eq('id', userId)
    .single();
  if (error) return null;
  return {
    xp: data.xp ?? 0,
    streakCount: data.streak_count ?? 0,
    streakLastDate: data.streak_last_date ?? '',
    streakFreezes: data.streak_freezes ?? 2,
    selectedTitleId: data.selected_title_id ?? 'the_newbie',
    unlockedTitleIds: data.unlocked_title_ids ?? ['the_newbie'],
    unlockedAchievementIds: data.unlocked_achievement_ids ?? [],
    rewardSessionCount: data.reward_session_count ?? 0,
  };
}

// ============ CREDITS ============

export async function getCreditsBalance(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();
  if (error) return 0;
  return data.credits ?? 0;
}

export async function convertXPToCredits(
  userId: string,
  xpAmount: number,
  creditAmount: number
): Promise<number> {
  const { data, error } = await supabase.rpc('convert_xp_to_credits', {
    p_user_id: userId,
    p_xp_amount: xpAmount,
    p_credit_amount: creditAmount,
  });
  if (error) throw error;
  return data as number;
}

export async function spendCreditsBuddyMatch(
  userId: string,
  cost: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc('spend_credits_buddy_match', {
    p_user_id: userId,
    p_cost: cost,
  });
  if (error) throw error;
  return data as boolean;
}

// ============ CHAT ROOMS ============

export async function getChatRooms(): Promise<ChatRoom[]> {
  const { data, error } = await supabase
    .from('chat_rooms')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data;
}

export async function joinChatRoom(
  roomId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.from('chat_room_participants').upsert(
    {
      room_id: roomId,
      user_id: userId,
      joined_at: new Date().toISOString(),
      left_at: null,
    },
    { onConflict: 'room_id,user_id' }
  );
  if (error) throw error;
}

export async function leaveChatRoom(
  roomId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('chat_room_participants')
    .update({ left_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .is('left_at', null);
  if (error) throw error;
}

// ============ MESSAGES ============

export async function sendMessage(
  senderId: string,
  content: string,
  target: { roomId: string } | { matchId: string }
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      content,
      room_id: 'roomId' in target ? target.roomId : null,
      match_id: 'matchId' in target ? target.matchId : null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMessages(
  target: { roomId: string } | { matchId: string },
  limit = 50
): Promise<Message[]> {
  let query = supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if ('roomId' in target) {
    query = query.eq('room_id', target.roomId);
  } else {
    query = query.eq('match_id', target.matchId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).reverse();
}

// ============ BUDDY MATCHING ============

export async function createBuddyMatch(
  userA: string,
  userB: string
): Promise<BuddyMatch | null> {
  const { data, error } = await supabase.rpc('create_buddy_match', {
    p_user_a: userA,
    p_user_b: userB,
  });
  if (error) throw error;
  return data;
}

export async function endBuddyMatch(matchId: string): Promise<void> {
  const { error } = await supabase
    .from('buddy_matches')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', matchId);
  if (error) throw error;
}

export async function getActiveMatch(userId: string): Promise<BuddyMatch | null> {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('buddy_matches')
    .select('*')
    .eq('status', 'active')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ============ LEADERBOARD ============

export interface LeaderboardEntry {
  id: string;
  display_name: string;
  avatar_emoji: string;
  xp: number;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_emoji, xp')
    .order('xp', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ============ LEAGUES ============

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/1/O/0 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createLeague(
  userId: string,
  name: string,
  emoji: string,
  description?: string
): Promise<League> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const joinCode = generateJoinCode();
    const { data, error } = await supabase
      .from('leagues')
      .insert({
        name: name.trim(),
        emoji,
        description: description?.trim() || null,
        join_code: joinCode,
        created_by: userId,
      })
      .select()
      .single();

    if (error && error.code === '23505') continue; // unique violation, retry
    if (error) throw error;

    // Auto-join the creator
    await supabase
      .from('league_members')
      .insert({ league_id: data.id, user_id: userId });

    return data;
  }
  throw new Error('Failed to generate unique join code');
}

export async function joinLeagueByCode(
  userId: string,
  code: string
): Promise<string> {
  const { data, error } = await supabase.rpc('join_league_by_code', {
    p_user_id: userId,
    p_code: code,
  });
  if (error) throw error;
  return data as string;
}

export async function leaveLeague(
  leagueId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('league_members')
    .delete()
    .eq('league_id', leagueId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteLeague(leagueId: string): Promise<void> {
  const { error } = await supabase
    .from('leagues')
    .delete()
    .eq('id', leagueId);
  if (error) throw error;
}

export async function getMyLeagues(userId: string): Promise<League[]> {
  const { data, error } = await supabase
    .from('league_members')
    .select('league_id, leagues(*)')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row: any) => row.leagues).filter(Boolean);
}

export async function getLeagueById(leagueId: string): Promise<League | null> {
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', leagueId)
    .single();
  if (error) return null;
  return data;
}

export async function getLeagueLeaderboard(
  leagueId: string
): Promise<LeagueLeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_league_leaderboard', {
    p_league_id: leagueId,
  });
  if (error) throw error;
  return (data ?? []) as LeagueLeaderboardEntry[];
}

export async function getLeagueMemberCount(
  leagueId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('league_members')
    .select('*', { count: 'exact', head: true })
    .eq('league_id', leagueId);
  if (error) throw error;
  return count ?? 0;
}
