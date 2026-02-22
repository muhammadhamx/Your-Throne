import { useEffect, useRef } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useAuthStore } from '@/stores/authStore';

export function useSession() {
  const user = useAuthStore((s) => s.user);
  const {
    isActive,
    elapsedSeconds,
    sessions,
    isLoading,
    startSession,
    stopSession,
    quickLog,
    updateMeta,
    removeSession,
    loadSessions,
    restoreActiveSession,
    tick,
  } = useSessionStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore active session on mount
  useEffect(() => {
    restoreActiveSession();
  }, [restoreActiveSession]);

  // Load session history
  useEffect(() => {
    if (user?.id) {
      loadSessions(user.id);
    }
  }, [user?.id, loadSessions]);

  // Timer tick
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(tick, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, tick]);

  const handleStart = async () => {
    if (!user?.id) return;
    await startSession(user.id);
  };

  const handleStop = async () => {
    if (!user?.id) return;
    return await stopSession(user.id);
  };

  const handleQuickLog = async (
    startedAt: string,
    durationSeconds: number,
    notes?: string
  ) => {
    if (!user?.id) return;
    await quickLog(user.id, startedAt, durationSeconds, notes);
  };

  const refreshSessions = async (userId: string) => {
    await loadSessions(userId);
  };

  return {
    isActive,
    elapsedSeconds,
    sessions,
    isLoading,
    startSession: handleStart,
    stopSession: handleStop,
    quickLog: handleQuickLog,
    updateMeta,
    removeSession,
    refreshSessions,
  };
}
