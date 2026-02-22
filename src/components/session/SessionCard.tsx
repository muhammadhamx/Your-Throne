import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Session } from '@/types/database';
import { formatDuration, formatDateTime } from '@/utils/formatters';
import { COLORS } from '@/utils/constants';

interface Props {
  session: Session;
  onRate?: (rating: number) => void;
}

export function SessionCard({ session, onRate }: Props) {
  const stars = session.rating
    ? '★'.repeat(session.rating) + '☆'.repeat(5 - session.rating)
    : null;

  const handleRate = async (rating: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRate?.(rating);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.emoji}>
            {session.is_quick_log ? '📝' : '🚽'}
          </Text>
        </View>

        <View style={styles.middle}>
          <Text style={styles.dateText}>
            {formatDateTime(session.started_at)}
          </Text>
          {session.notes && (
            <Text style={styles.notes} numberOfLines={1}>
              {session.notes}
            </Text>
          )}
          {stars && <Text style={styles.rating}>{stars}</Text>}
        </View>

        <View style={styles.right}>
          <Text style={styles.duration}>
            {session.duration_seconds
              ? formatDuration(session.duration_seconds)
              : '—'}
          </Text>
        </View>
      </View>

      {onRate && !session.rating && (
        <View style={styles.rateRow}>
          <Text style={styles.rateLabel}>Rate:</Text>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              onPress={() => handleRate(n)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text style={styles.rateStar}>☆</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  left: {
    marginRight: 12,
  },
  emoji: {
    fontSize: 24,
  },
  middle: {
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  notes: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rating: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: 2,
  },
  right: {
    marginLeft: 12,
  },
  duration: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 6,
  },
  rateLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  rateStar: {
    fontSize: 22,
    color: COLORS.accent,
  },
});
