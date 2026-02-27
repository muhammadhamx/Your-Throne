import { create } from 'zustand';
import type { League, LeagueLeaderboardEntry } from '@/types/database';
import {
  createLeague,
  joinLeagueByCode,
  leaveLeague,
  deleteLeague,
  getMyLeagues,
  getLeagueById,
  getLeagueLeaderboard,
} from '@/lib/database';

interface LeagueState {
  leagues: League[];
  currentLeague: League | null;
  leaderboard: LeagueLeaderboardEntry[];
  isLoading: boolean;
  error: string | null;

  loadMyLeagues: (userId: string) => Promise<void>;
  create: (userId: string, name: string, emoji: string, description?: string) => Promise<League>;
  join: (userId: string, code: string) => Promise<string>;
  leave: (leagueId: string, userId: string) => Promise<void>;
  remove: (leagueId: string) => Promise<void>;
  loadLeague: (leagueId: string) => Promise<void>;
  loadLeaderboard: (leagueId: string) => Promise<void>;
  setCurrentLeague: (league: League | null) => void;
  clearError: () => void;
}

export const useLeagueStore = create<LeagueState>((set, get) => ({
  leagues: [],
  currentLeague: null,
  leaderboard: [],
  isLoading: false,
  error: null,

  loadMyLeagues: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const leagues = await getMyLeagues(userId);
      set({ leagues, isLoading: false });
    } catch {
      set({ error: 'Failed to load leagues', isLoading: false });
    }
  },

  create: async (userId, name, emoji, description) => {
    set({ isLoading: true, error: null });
    try {
      const league = await createLeague(userId, name, emoji, description);
      set((state) => ({
        leagues: [league, ...state.leagues],
        isLoading: false,
      }));
      return league;
    } catch (err: any) {
      set({ error: err?.message || 'Failed to create league', isLoading: false });
      throw err;
    }
  },

  join: async (userId, code) => {
    set({ isLoading: true, error: null });
    try {
      const leagueId = await joinLeagueByCode(userId, code);
      await get().loadMyLeagues(userId);
      set({ isLoading: false });
      return leagueId;
    } catch (err: any) {
      const message = err?.message?.includes('not found')
        ? 'Invalid league code'
        : 'Failed to join league';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  leave: async (leagueId, userId) => {
    try {
      await leaveLeague(leagueId, userId);
      set((state) => ({
        leagues: state.leagues.filter((l) => l.id !== leagueId),
        currentLeague: state.currentLeague?.id === leagueId ? null : state.currentLeague,
      }));
    } catch {
      set({ error: 'Failed to leave league' });
    }
  },

  remove: async (leagueId) => {
    try {
      await deleteLeague(leagueId);
      set((state) => ({
        leagues: state.leagues.filter((l) => l.id !== leagueId),
        currentLeague: state.currentLeague?.id === leagueId ? null : state.currentLeague,
      }));
    } catch {
      set({ error: 'Failed to delete league' });
    }
  },

  loadLeague: async (leagueId) => {
    try {
      const league = await getLeagueById(leagueId);
      if (league) set({ currentLeague: league });
    } catch {
      // Silent fail
    }
  },

  loadLeaderboard: async (leagueId) => {
    set({ isLoading: true, error: null });
    try {
      const leaderboard = await getLeagueLeaderboard(leagueId);
      set({ leaderboard, isLoading: false });
    } catch {
      set({ error: 'Failed to load leaderboard', isLoading: false });
    }
  },

  setCurrentLeague: (league) => set({ currentLeague: league }),

  clearError: () => set({ error: null }),
}));
