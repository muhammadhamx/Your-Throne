import { create } from 'zustand';
import { getCreditsBalance, convertXPToCredits, spendCreditsBuddyMatch, getWeeklyCreditsConverted } from '@/lib/database';
import { CREDITS } from '@/utils/constants';

interface CreditsState {
  credits: number;
  weeklyConverted: number;
  isLoading: boolean;

  loadCredits: (userId: string) => Promise<void>;
  loadWeeklyCap: (userId: string) => Promise<void>;
  convertXP: (userId: string, xpAmount: number) => Promise<void>;
  spendOnBuddyMatch: (userId: string) => Promise<boolean>;
  setCredits: (credits: number) => void;
  reset: () => void;
}

export const useCreditsStore = create<CreditsState>((set, get) => ({
  credits: 0,
  weeklyConverted: 0,
  isLoading: false,

  loadCredits: async (userId: string) => {
    set({ isLoading: true });
    try {
      const credits = await getCreditsBalance(userId);
      set({ credits, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  loadWeeklyCap: async (userId: string) => {
    try {
      const converted = await getWeeklyCreditsConverted(userId);
      set({ weeklyConverted: converted });
    } catch {
      // Silent fail
    }
  },

  convertXP: async (userId: string, xpAmount: number) => {
    const creditAmount = Math.floor(xpAmount / CREDITS.XP_PER_CREDIT);
    if (creditAmount <= 0) return;

    // Check weekly cap
    const { weeklyConverted } = get();
    const remaining = CREDITS.WEEKLY_CONVERT_CAP - weeklyConverted;
    if (remaining <= 0) throw new Error('Weekly conversion cap reached');
    if (creditAmount > remaining) throw new Error(`Can only convert ${remaining} more credits this week`);

    const newCredits = await convertXPToCredits(userId, xpAmount, creditAmount);
    set({
      credits: newCredits,
      weeklyConverted: weeklyConverted + creditAmount,
    });

    // Update gamification store XP (lazy import to avoid circular deps)
    const { useGamificationStore } = require('@/stores/gamificationStore');
    const store = useGamificationStore.getState();
    await store.initialize();
  },

  spendOnBuddyMatch: async (userId: string) => {
    const { credits } = get();
    if (credits < CREDITS.BUDDY_MATCH_COST) return false;

    const success = await spendCreditsBuddyMatch(userId, CREDITS.BUDDY_MATCH_COST);
    if (success) {
      set({ credits: credits - CREDITS.BUDDY_MATCH_COST });
    }
    return success;
  },

  setCredits: (credits: number) => set({ credits }),

  reset: () => set({ credits: 0, weeklyConverted: 0, isLoading: false }),
}));
