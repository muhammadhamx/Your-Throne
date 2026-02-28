import { create } from 'zustand';
import type { ShopItem } from '@/types/database';
import { getShopItems, getOwnedShopItems, purchaseShopItem } from '@/lib/database';

interface ShopState {
  items: ShopItem[];
  ownedItems: string[];
  isLoading: boolean;
  error: string | null;

  loadShop: (userId: string) => Promise<void>;
  purchase: (userId: string, itemId: string) => Promise<{ creditsRemaining: number }>;
  clearError: () => void;
  reset: () => void;
}

export const useShopStore = create<ShopState>((set, get) => ({
  items: [],
  ownedItems: [],
  isLoading: false,
  error: null,

  loadShop: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const [items, owned] = await Promise.all([
        getShopItems(),
        getOwnedShopItems(userId),
      ]);
      set({ items, ownedItems: owned, isLoading: false });
    } catch {
      set({ error: 'Failed to load shop', isLoading: false });
    }
  },

  purchase: async (userId, itemId) => {
    set({ error: null });
    try {
      const result = await purchaseShopItem(userId, itemId);

      // Update owned items locally
      const item = get().items.find((i) => i.id === itemId);
      if (item && !item.is_repeatable) {
        set((s) => ({ ownedItems: [...s.ownedItems, itemId] }));
      }

      // Update credits in credits store
      const { useCreditsStore } = require('@/stores/creditsStore');
      useCreditsStore.getState().setCredits(result.creditsRemaining);

      return result;
    } catch (err: any) {
      const message = err?.message || 'Purchase failed';
      set({ error: message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({ items: [], ownedItems: [], isLoading: false, error: null }),
}));
