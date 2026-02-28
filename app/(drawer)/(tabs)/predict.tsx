import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import { buildModel, predictNextSession, getInsights } from '@/prediction/engine';
import { formatTime, formatDuration } from '@/utils/formatters';
import { getRandomItem, EMPTY_STATE_MESSAGES } from '@/humor/jokes';
import { MIN_SESSIONS_FOR_PREDICTION, COLORS, GRADIENTS, SHADOWS, RADIUS, SPACING } from '@/utils/constants';
import { format } from 'date-fns';

const INSIGHT_ICONS: Record<string, string> = {
  peak_times: '⏰',
  regularity: '🎯',
  default: '📅',
};

export default function PredictScreen() {
  const user = useAuthStore((s) => s.user);
  const sessions = useSessionStore((s) => s.sessions);
  const loadSessions = useSessionStore((s) => s.loadSessions);

  useEffect(() => {
    if (user?.id) {
      loadSessions(user.id);
    }
  }, [user?.id, loadSessions]);

  const model = useMemo(() => buildModel(sessions), [sessions]);
  const prediction = useMemo(() => predictNextSession(model), [model]);
  const insights = useMemo(() => getInsights(model), [model]);

  const progress = sessions.length / MIN_SESSIONS_FOR_PREDICTION;

  if (sessions.length < MIN_SESSIONS_FOR_PREDICTION) {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
          <View style={styles.orbGlow} />
          <Text style={styles.emptyOrb}>🔮</Text>
          <Text style={styles.emptyTitle}>Building Your Model</Text>
          <Text style={styles.emptyText}>
            {getRandomItem(EMPTY_STATE_MESSAGES.prediction)}
          </Text>

          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>
                Sessions logged
              </Text>
              <Text style={styles.progressCount}>
                {sessions.length} / {MIN_SESSIONS_FOR_PREDICTION}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View
                entering={FadeIn.delay(300).duration(600)}
                style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any }]}
              />
            </View>
            <Text style={styles.progressHint}>
              {MIN_SESSIONS_FOR_PREDICTION - sessions.length} more to unlock predictions
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Main Prediction Card */}
      {prediction ? (
        <Animated.View
          entering={FadeInDown.delay(50).duration(500).springify()}
          style={styles.predictionCard}
        >
          <LinearGradient
            colors={['#1A3A5C', '#0D1F35']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.predictionGradient}
          >
            {/* Decorative circles */}
            <View style={styles.decor1} />
            <View style={styles.decor2} />

            <Text style={styles.predictionLabel}>NEXT PREDICTED SESSION</Text>

            <Animated.Text
              entering={ZoomIn.delay(200).springify()}
              style={styles.predictionOrb}
            >
              🔮
            </Animated.Text>

            <Text style={styles.predictionTime}>
              {formatTime(prediction.predictedTime.toISOString())}
            </Text>
            <Text style={styles.predictionDay}>
              {format(prediction.predictedTime, 'EEEE, MMMM d')}
            </Text>

            <CountdownText targetTime={prediction.predictedTime} />

            {/* Confidence bar */}
            <View style={styles.confidenceSection}>
              <View style={styles.confidenceHeader}>
                <Text style={styles.confidenceLabel}>Model Confidence</Text>
                <Text style={styles.confidenceValue}>
                  {Math.round(prediction.confidence * 100)}%
                </Text>
              </View>
              <View style={styles.confidenceTrack}>
                <View
                  style={[
                    styles.confidenceFill,
                    { width: `${Math.round(prediction.confidence * 100)}%` as any },
                  ]}
                />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeInDown.delay(50).duration(500).springify()}
          style={styles.noPredictionCard}
        >
          <Text style={styles.noDataOrb}>🤷</Text>
          <Text style={styles.noDataTitle}>No Pattern Yet</Text>
          <Text style={styles.noDataText}>
            Can't find a clear pattern yet. Keep logging and come back!
          </Text>
        </Animated.View>
      )}

      {/* Pattern Insights */}
      {insights.length > 0 && (
        <Animated.View entering={FadeInDown.delay(200).duration(500).springify()}>
          <Text style={styles.sectionTitle}>Pattern Insights</Text>
          {insights.map((insight, i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(250 + i * 80).duration(400).springify()}
              style={styles.insightCard}
            >
              <View style={styles.insightIconCircle}>
                <Text style={styles.insightEmoji}>
                  {INSIGHT_ICONS[insight.type] ?? INSIGHT_ICONS.default}
                </Text>
              </View>
              <Text style={styles.insightText}>{insight.message}</Text>
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {/* Model info */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(400)}
        style={styles.modelInfo}
      >
        <Text style={styles.modelInfoText}>
          Based on {model.totalSessions} sessions
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

function CountdownText({ targetTime }: { targetTime: Date }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diffMs = targetTime.getTime() - now.getTime();

  if (diffMs <= 0) {
    return (
      <View style={styles.countdownContainer}>
        <Text style={styles.countdownNow}>Any moment now...</Text>
      </View>
    );
  }

  const diffSeconds = Math.round(diffMs / 1000);
  return (
    <View style={styles.countdownContainer}>
      <Text style={styles.countdownLabel}>IN ABOUT</Text>
      <Text style={styles.countdownValue}>{formatDuration(diffSeconds)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING['2xl'],
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING['4xl'],
  },
  orbGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.accent,
    opacity: 0.04,
    top: 20,
  },
  emptyOrb: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  progressSection: {
    width: '100%',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  progressLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  progressCount: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
  },
  progressHint: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },

  // Prediction card
  predictionCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.cardElevated,
    marginBottom: SPACING.md,
  },
  predictionGradient: {
    padding: SPACING['2xl'],
    alignItems: 'center',
    overflow: 'hidden',
  },
  decor1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0,212,160,0.06)',
  },
  decor2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(74,155,196,0.06)',
  },
  predictionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(240,246,255,0.4)',
    letterSpacing: 2,
    marginBottom: SPACING.md,
  },
  predictionOrb: {
    fontSize: 56,
    marginBottom: SPACING.md,
  },
  predictionTime: {
    fontSize: 48,
    fontWeight: '200',
    color: COLORS.text,
    letterSpacing: -1,
  },
  predictionDay: {
    fontSize: 16,
    color: 'rgba(240,246,255,0.55)',
    marginTop: 4,
    fontWeight: '500',
  },
  countdownContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
    backgroundColor: 'rgba(0,212,160,0.1)',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(0,212,160,0.2)',
  },
  countdownLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(0,212,160,0.6)',
    letterSpacing: 1.5,
  },
  countdownValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent,
  },
  countdownNow: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accent,
  },
  confidenceSection: {
    width: '100%',
    marginTop: SPACING.xl,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  confidenceLabel: {
    fontSize: 11,
    color: 'rgba(240,246,255,0.4)',
    fontWeight: '600',
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accent,
  },
  confidenceTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: 5,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
  },

  // No prediction
  noPredictionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING['2xl'],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.md,
  },
  noDataOrb: { fontSize: 48, marginBottom: SPACING.sm },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  noDataText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Insights
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    letterSpacing: -0.3,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
  },
  insightIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightEmoji: {
    fontSize: 18,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
  },
  modelInfo: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  modelInfoText: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
});
