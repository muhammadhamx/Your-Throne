import { create } from 'zustand';
import type { WeeklyLeagueResult, ChampionNote } from '@/types/database';
import { getLatestWeeklyResult, getChampionNotes, submitChampionNote } from '@/lib/database';

interface WeeklyResultState {
  latestResult: WeeklyLeagueResult | null;
  championNotes: ChampionNote[];
  isLoading: boolean;
  hasPostedNote: boolean;
  isWinningMember: boolean;

  loadLatestResult: (userId?: string) => Promise<void>;
  loadChampionNotes: (weeklyResultId: string) => Promise<void>;
  postNote: (userId: string, note: string) => Promise<void>;
  reset: () => void;
}

export const useWeeklyResultStore = create<WeeklyResultState>((set, get) => ({
  latestResult: null,
  championNotes: [],
  isLoading: false,
  hasPostedNote: false,
  isWinningMember: false,

  loadLatestResult: async (userId) => {
    set({ isLoading: true });
    try {
      const result = await getLatestWeeklyResult();
      const isWinningMember = userId && result
        ? result.winning_members.some((m) => m.user_id === userId)
        : false;

      set({ latestResult: result, isWinningMember, isLoading: false });

      if (result) {
        await get().loadChampionNotes(result.id);
        // Check if user already posted
        if (userId) {
          const notes = get().championNotes;
          const hasPosted = notes.some((n) => n.user_id === userId);
          set({ hasPostedNote: hasPosted });
        }
      }
    } catch {
      set({ isLoading: false });
    }
  },

  loadChampionNotes: async (weeklyResultId) => {
    try {
      const notes = await getChampionNotes(weeklyResultId);
      set({ championNotes: notes });
    } catch {
      // Silent fail
    }
  },

  postNote: async (userId, note) => {
    await submitChampionNote(userId, note);
    set({ hasPostedNote: true });
    // Reload notes
    const result = get().latestResult;
    if (result) {
      await get().loadChampionNotes(result.id);
    }
  },

  reset: () => set({
    latestResult: null,
    championNotes: [],
    isLoading: false,
    hasPostedNote: false,
    isWinningMember: false,
  }),
}));
