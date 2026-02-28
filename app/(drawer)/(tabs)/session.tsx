import { useState, useCallback, useEffect, useRef, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '@/hooks/useSession';
import { useAuthStore } from '@/stores/authStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useConfetti } from '@/contexts/ConfettiContext';
import { SessionTimer } from '@/components/session/SessionTimer';
import { QuickLogForm } from '@/components/session/QuickLogForm';
import { SessionCard } from '@/components/session/SessionCard';
import { StillPoopingPopup } from '@/components/session/StillPoopingPopup';
import { SessionStartPopup } from '@/components/session/SessionStartPopup';
import { PostSessionSummary } from '@/components/session/PostSessionSummary';
import { GreetingBanner } from '@/components/home/GreetingBanner';
import { ChampionsWallCard } from '@/components/home/ChampionsWallCard';
import { StreakCard } from '@/components/home/StreakCard';
import { DailyChallengesCard } from '@/components/home/DailyChallengesCard';
import { VictoryDialog } from '@/components/leagues/VictoryDialog';
import { useWeeklyResultStore } from '@/stores/weeklyResultStore';
import { getRandomItem, EMPTY_STATE_MESSAGES } from '@/humor/jokes';
import { COLORS, SHADOWS, RADIUS, SPACING } from '@/utils/constants';
import type { Session } from '@/types/database';
import type { SessionReward } from '@/gamification/rewards';

// ─── Static cards — memoized so they don't re-render on timer tick ───

const StaticCards = memo(function StaticCards() {
  return (
    <>
      <GreetingBanner />
      <ChampionsWallCard />
      <StreakCard />
      <DailyChallengesCard />
    </>
  );
});

const ListHeader = memo(function ListHeader({
  isActive,
  onStart,
  onStop,
  showQuickLog,
  onToggleQuickLog,
  onQuickLog,
  sessionCount,
}: {
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
  showQuickLog: boolean;
  onToggleQuickLog: () => void;
  onQuickLog: (startedAt: string, durationSeconds: number, notes?: string) => Promise<void>;
  sessionCount: number;
}) {
  return (
    <View>
      <StaticCards />

      {/* Session timer — subscribes to store internally, won't re-render ListHeader */}
      <SessionTimer onStart={onStart} onStop={onStop} />

      {/* Quick Log toggle */}
      {!isActive && (
        <TouchableOpacity
          style={styles.quickLogToggle}
          onPress={onToggleQuickLog}
          activeOpacity={0.7}
        >
          <View style={styles.quickLogPill}>
            <Ionicons
              name={showQuickLog ? 'chevron-up' : 'pencil-outline'}
              size={15}
              color={COLORS.accent}
            />
            <Text style={styles.quickLogText}>
              {showQuickLog ? 'Hide Quick Log' : 'Log a Past Session'}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {showQuickLog && !isActive && <QuickLogForm onSubmit={onQuickLog} />}

      {/* History section header */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>History</Text>
        <View style={styles.historyBadge}>
          <Text style={styles.historyCount}>{sessionCount}</Text>
        </View>
      </View>
    </View>
  );
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

const RECENT_SESSIONS_LIMIT = 3;

export default function SessionScreen() {
  const {
    isActive,
    sessions,
    startSession,
    stopSession,
    quickLog,
    updateMeta,
    refreshSessions,
  } = useSession();

  const user = useAuthStore((s) => s.user);
  const { initialize: initGamification, isLoaded: gamificationLoaded, rank, streak } = useGamificationStore();
  const { fire: fireConfetti } = useConfetti();
  const { isWinningMember, hasPostedNote, latestResult, loadLatestResult } = useWeeklyResultStore();
  const [showVictoryDialog, setShowVictoryDialog] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const prevRankId = useRef<string | null>(null);

  const [summaryVisible, setSummaryVisible] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    duration: number;
    reward: SessionReward;
  } | null>(null);

  useEffect(() => {
    if (!gamificationLoaded) {
      initGamification();
    }
  }, [gamificationLoaded, initGamification]);

  // Load weekly result and show victory dialog if user is a winner
  useEffect(() => {
    if (user?.id) {
      loadLatestResult(user.id);
    }
  }, [user?.id, loadLatestResult]);

  useEffect(() => {
    if (isWinningMember && !hasPostedNote && latestResult) {
      setShowVictoryDialog(true);
    }
  }, [isWinningMember, hasPostedNote, latestResult]);

  useEffect(() => {
    if (!gamificationLoaded) return;
    if (prevRankId.current === null) {
      prevRankId.current = rank.id;
      return;
    }
    if (rank.id !== prevRankId.current) {
      prevRankId.current = rank.id;
      fireConfetti();
      Alert.alert(
        `${rank.emoji} Rank Up!`,
        `You've ascended to ${rank.name}!\n\n"${rank.description}"`
      );
    }
  }, [rank.id, gamificationLoaded]);

  const onRefresh = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await refreshSessions(user.id);
    setRefreshing(false);
  }, [user?.id, refreshSessions]);

  const handleStop = useCallback(async () => {
    try {
      const result = await stopSession();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (result?.session?.duration_seconds) {
        setSummaryData({
          duration: result.session.duration_seconds,
          reward: result.reward,
        });
        setSummaryVisible(true);
        if (result.reward.luckyPoop || result.reward.mysteryBox) {
          fireConfetti();
        }
      }
    } catch {
      Alert.alert('Error', 'Failed to end session.');
    }
  }, [stopSession, fireConfetti]);

  const handleRate = useCallback(async (session: Session, rating: number) => {
    await updateMeta(session.id, { rating });
  }, [updateMeta]);

  const handleDismissSummary = useCallback(() => setSummaryVisible(false), []);
  const handleToggleQuickLog = useCallback(() => setShowQuickLog((v) => !v), []);
  const handleToggleAllSessions = useCallback(() => setShowAllSessions((v) => !v), []);

  const displaySessions = showAllSessions
    ? sessions
    : sessions.slice(0, RECENT_SESSIONS_LIMIT);
  const hasMoreSessions = sessions.length > RECENT_SESSIONS_LIMIT;

  const renderItem = useCallback(({ item, index }: { item: Session; index: number }) => (
    <SessionCard
      session={item}
      index={index}
      onRate={!item.rating ? (rating: number) => handleRate(item, rating) : undefined}
    />
  ), [handleRate]);

  const keyExtractor = useCallback((item: Session) => item.id, []);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🧻</Text>
      <Text style={styles.emptyTitle}>No sessions yet</Text>
      <Text style={styles.emptyText}>
        {getRandomItem(EMPTY_STATE_MESSAGES.sessions)}
      </Text>
    </View>
  ), []);

  const headerElement = (
    <ListHeader
      isActive={isActive}
      onStart={startSession}
      onStop={handleStop}
      showQuickLog={showQuickLog}
      onToggleQuickLog={handleToggleQuickLog}
      onQuickLog={quickLog}
      sessionCount={sessions.length}
    />
  );

  return (
    <View style={styles.container}>
      <StillPoopingPopup />
      <SessionStartPopup isActive={isActive} />

      {/* Victory Dialog for winning league members */}
      {user?.id && latestResult && (
        <VictoryDialog
          visible={showVictoryDialog}
          userId={user.id}
          leagueEmoji={latestResult.winning_league_emoji}
          onDismiss={() => setShowVictoryDialog(false)}
        />
      )}

      {summaryData && (
        <PostSessionSummary
          visible={summaryVisible}
          duration={summaryData.duration}
          reward={summaryData.reward}
          streak={streak.count}
          onClose={handleDismissSummary}
        />
      )}

      <FlatList
        data={displaySessions}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={headerElement}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          hasMoreSessions ? (
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={handleToggleAllSessions}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showAllSessions ? 'chevron-up' : 'chevron-down'}
                size={15}
                color={COLORS.accent}
              />
              <Text style={styles.viewAllText}>
                {showAllSessions
                  ? 'Show less'
                  : `View all ${sessions.length} sessions`}
              </Text>
            </TouchableOpacity>
          ) : null
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    paddingBottom: SPACING['2xl'],
  },
  quickLogToggle: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  quickLogPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.surfaceRaised,
    paddingVertical: 10,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
  },
  quickLogText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  historyBadge: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  historyCount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
    paddingHorizontal: SPACING['2xl'],
  },
  emptyEmoji: {
    fontSize: 52,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: SPACING.md,
    marginTop: 4,
    marginBottom: SPACING.md,
    paddingVertical: 13,
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
