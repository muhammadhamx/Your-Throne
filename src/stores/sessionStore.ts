import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@/types/database';
import {
  insertSession,
  endSession,
  quickLogSession,
  getUserSessions,
  updateSessionMeta,
  deleteSession,
} from '@/lib/database';
import { updateProfile } from '@/lib/database';
import { useChatStore } from '@/stores/chatStore';

const ACTIVE_SESSION_KEY = 'active_session';

interface ActiveSessionData {
  startTime: number;
  sessionId: string;
}

interface SessionState {
  isActive: boolean;
  startTime: number | null;
  elapsedSeconds: number;
  currentSessionId: string | null;
  sessions: Session[];
  isLoading: boolean;

  // Actions
  startSession: (userId: string) => Promise<void>;
  stopSession: (userId: string) => Promise<Session>;
  quickLog: (
    userId: string,
    startedAt: string,
    durationSeconds: number,
    notes?: string
  ) => Promise<void>;
  updateMeta: (
    sessionId: string,
    updates: { rating?: number; notes?: string }
  ) => Promise<void>;
  removeSession: (sessionId: string) => Promise<void>;
  loadSessions: (userId: string) => Promise<void>;
  restoreActiveSession: () => Promise<void>;
  tick: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  isActive: false,
  startTime: null,
  elapsedSeconds: 0,
  currentSessionId: null,
  sessions: [],
  isLoading: false,

  startSession: async (userId: string) => {
    const now = Date.now();
    const startedAt = new Date(now).toISOString();

    const session = await insertSession(userId, startedAt);

    await updateProfile(userId, {
      is_in_session: true,
      session_started_at: startedAt,
    });

    // Persist to AsyncStorage for background survival
    await AsyncStorage.setItem(
      ACTIVE_SESSION_KEY,
      JSON.stringify({ startTime: now, sessionId: session.id })
    );

    set({
      isActive: true,
      startTime: now,
      elapsedSeconds: 0,
      currentSessionId: session.id,
    });
  },

  stopSession: async (userId: string) => {
    const { currentSessionId, startTime } = get();
    if (!currentSessionId || !startTime) {
      throw new Error('No active session');
    }

    const now = Date.now();
    const endedAt = new Date(now).toISOString();
    const durationSeconds = Math.round((now - startTime) / 1000);

    const updated = await endSession(currentSessionId, endedAt, durationSeconds);

    await updateProfile(userId, {
      is_in_session: false,
      session_started_at: null,
    });

    // Stop buddy searching and presence when session ends
    const chatState = useChatStore.getState();
    if (chatState.isSearchingBuddy) {
      await chatState.stopSearching(userId);
    }
    chatState.unsubscribeFromPresence();

    await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);

    set((state) => ({
      isActive: false,
      startTime: null,
      elapsedSeconds: 0,
      currentSessionId: null,
      sessions: [updated, ...state.sessions],
    }));

    return updated;
  },

  quickLog: async (userId, startedAt, durationSeconds, notes) => {
    const session = await quickLogSession(
      userId,
      startedAt,
      durationSeconds,
      notes
    );
    set((state) => ({
      sessions: [session, ...state.sessions],
    }));
  },

  updateMeta: async (sessionId, updates) => {
    await updateSessionMeta(sessionId, updates);
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, ...updates } : s
      ),
    }));
  },

  removeSession: async (sessionId) => {
    await deleteSession(sessionId);
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
    }));
  },

  loadSessions: async (userId) => {
    set({ isLoading: true });
    try {
      const sessions = await getUserSessions(userId);
      set({ sessions, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  restoreActiveSession: async () => {
    try {
      const stored = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
      if (stored) {
        const data: ActiveSessionData = JSON.parse(stored);
        const elapsed = Math.round((Date.now() - data.startTime) / 1000);
        set({
          isActive: true,
          startTime: data.startTime,
          elapsedSeconds: elapsed,
          currentSessionId: data.sessionId,
        });
      }
    } catch {
      // Ignore restore errors
    }
  },

  tick: () => {
    const { isActive, startTime } = get();
    if (isActive && startTime) {
      set({ elapsedSeconds: Math.round((Date.now() - startTime) / 1000) });
    }
  },
}));
