import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSession } from '@/hooks/useSession';
import { useAuthStore } from '@/stores/authStore';
import { SessionTimer } from '@/components/session/SessionTimer';
import { QuickLogForm } from '@/components/session/QuickLogForm';
import { SessionCard } from '@/components/session/SessionCard';
import { StillPoopingPopup } from '@/components/session/StillPoopingPopup';
import { getSessionSummaryMessage, getRandomItem, EMPTY_STATE_MESSAGES } from '@/humor/jokes';
import { COLORS } from '@/utils/constants';
import { formatDuration } from '@/utils/formatters';
import type { Session } from '@/types/database';

export default function SessionScreen() {
  const {
    isActive,
    elapsedSeconds,
    sessions,
    isLoading,
    startSession,
    stopSession,
    quickLog,
    updateMeta,
    refreshSessions,
  } = useSession();

  const user = useAuthStore((s) => s.user);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [lastSummary, setLastSummary] = useState<{
    duration: number;
    message: string;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await refreshSessions(user.id);
    setRefreshing(false);
  }, [user?.id, refreshSessions]);

  const handleStop = async () => {
    try {
      const session = await stopSession();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (session?.duration_seconds) {
        setLastSummary({
          duration: session.duration_seconds,
          message: getSessionSummaryMessage(session.duration_seconds),
        });
      }
    } catch {
      Alert.alert('Error', 'Failed to end session.');
    }
  };

  const handleRate = async (session: Session, rating: number) => {
    await updateMeta(session.id, { rating });
  };

  const renderHeader = () => (
    <View>
      <SessionTimer
        isActive={isActive}
        elapsedSeconds={elapsedSeconds}
        onStart={startSession}
        onStop={handleStop}
      />

      {lastSummary && !isActive && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryDuration}>
            {formatDuration(lastSummary.duration)}
          </Text>
          <Text style={styles.summaryMessage}>{lastSummary.message}</Text>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={() => setLastSummary(null)}
          >
            <Text style={styles.dismissText}>Nice</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isActive && (
        <TouchableOpacity
          style={styles.quickLogToggle}
          onPress={() => setShowQuickLog(!showQuickLog)}
        >
          <Text style={styles.quickLogToggleText}>
            {showQuickLog ? 'Hide Quick Log' : '+ Quick Log a Past Session'}
          </Text>
        </TouchableOpacity>
      )}

      {showQuickLog && !isActive && <QuickLogForm onSubmit={quickLog} />}

      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>History</Text>
        <Text style={styles.historyCount}>
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🧻</Text>
      <Text style={styles.emptyText}>
        {getRandomItem(EMPTY_STATE_MESSAGES.sessions)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StillPoopingPopup isActive={isActive} elapsedSeconds={elapsedSeconds} />

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            onRate={!item.rating ? (rating) => handleRate(item, rating) : undefined}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
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
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryDuration: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
  },
  summaryMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  dismissButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  dismissText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  quickLogToggle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  quickLogToggleText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  historyCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
