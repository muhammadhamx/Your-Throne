import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { Session } from '@/types/database';
import { formatDuration, formatDateTime } from '@/utils/formatters';
import { COLORS, SHADOWS, RADIUS, SPACING } from '@/utils/constants';

interface Props {
  session: Session;
  onRate?: (rating: number) => void;
  index?: number;
}

function getSessionAccent(session: Session): string {
  if (session.is_quick_log) return '#818CF8';
  if (session.duration_seconds && session.duration_seconds > 900) return COLORS.error;
  if (session.rating && session.rating >= 4) return COLORS.accent;
  return COLORS.primaryLight;
}

function getSessionLabel(session: Session): string {
  if (session.is_quick_log) return 'Quick Log';
  if (session.duration_seconds) {
    if (session.duration_seconds < 60) return 'Speed Run';
    if (session.duration_seconds > 900) return 'Marathon';
  }
  return 'Session';
}

export function SessionCard({ session, onRate, index = 0 }: Props) {
  const stars = session.rating
    ? '★'.repeat(session.rating) + '☆'.repeat(5 - session.rating)
    : null;
  const accent = getSessionAccent(session);
  const label = getSessionLabel(session);

  const handleRate = async (rating: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRate?.(rating);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(400).springify()}
      style={styles.container}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accent }]} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          {/* Icon circle */}
          <View style={[styles.iconCircle, { backgroundColor: accent + '18' }]}>
            <Text style={styles.icon}>
              {session.is_quick_log ? '📝' : '🚽'}
            </Text>
          </View>

          {/* Middle info */}
          <View style={styles.infoColumn}>
            <View style={styles.topLine}>
              <Text style={styles.dateText}>
                {formatDateTime(session.started_at)}
              </Text>
              <View style={[styles.labelBadge, { backgroundColor: accent + '18' }]}>
                <Text style={[styles.labelText, { color: accent }]}>{label}</Text>
              </View>
            </View>

            {session.notes && (
              <Text style={styles.notes} numberOfLines={1}>
                {session.notes}
              </Text>
            )}
            {stars && <Text style={styles.rating}>{stars}</Text>}
          </View>

          {/* Duration */}
          <Text style={[styles.duration, { color: accent }]}>
            {session.duration_seconds
              ? formatDuration(session.duration_seconds)
              : '—'}
          </Text>
        </View>

        {/* Rate row */}
        {onRate && !session.rating && (
          <View style={styles.rateRow}>
            <Text style={styles.rateLabel}>How was it?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => handleRate(n)}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  style={styles.starBtn}
                >
                  <Text style={styles.starText}>☆</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  accentBar: {
    width: 3,
  },
  content: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: SPACING.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: 18,
  },
  infoColumn: {
    flex: 1,
    gap: 3,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  labelBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  notes: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  rating: {
    fontSize: 12,
    color: COLORS.accent,
    letterSpacing: 1,
  },
  duration: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  rateLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  starBtn: {
    padding: 2,
  },
  starText: {
    fontSize: 22,
    color: COLORS.accent,
  },
});
