import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useWeeklyResultStore } from '@/stores/weeklyResultStore';
import { COLORS, GRADIENTS, SHADOWS, SPACING, RADIUS } from '@/utils/constants';

export function ChampionsWallCard() {
  const userId = useAuthStore((s) => s.user?.id);
  const { latestResult, championNotes, isLoading, loadLatestResult } = useWeeklyResultStore();

  useEffect(() => {
    loadLatestResult(userId);
  }, [userId, loadLatestResult]);

  if (isLoading || !latestResult) return null;

  return (
    <Animated.View entering={FadeInDown.delay(150).springify().damping(18)}>
      <View style={styles.card}>
        {/* Gold accent top bar */}
        <LinearGradient
          colors={GRADIENTS.gold}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentBar}
        />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.trophyCircle}>
            <Text style={styles.trophyEmoji}>🏆</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerLabel}>CHAMPION'S WALL</Text>
            <View style={styles.winnerRow}>
              <Text style={styles.winnerEmoji}>{latestResult.winning_league_emoji}</Text>
              <Text style={styles.winnerName} numberOfLines={1}>
                {latestResult.winning_league_name}
              </Text>
            </View>
          </View>
          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeText}>
              {latestResult.winning_league_total_xp.toLocaleString()}
            </Text>
            <Text style={styles.xpBadgeUnit}>XP</Text>
          </View>
        </View>

        {/* Members + Notes */}
        <View style={styles.notesContainer}>
          {latestResult.winning_members.map((member) => {
            const note = championNotes.find((n) => n.user_id === member.user_id);
            return (
              <View key={member.user_id} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarEmoji}>{member.avatar_emoji}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {member.display_name}
                  </Text>
                  {note ? (
                    <View style={styles.speechBubble}>
                      <Text style={styles.noteText}>"{note.note}"</Text>
                    </View>
                  ) : (
                    <Text style={styles.pendingNote}>...</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <TouchableOpacity
          style={styles.footer}
          onPress={() => router.push('/leagues/global')}
          activeOpacity={0.7}
        >
          <Text style={styles.footerText}>View Full Rankings</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F5A62330',
    ...SHADOWS.card,
  },
  accentBar: {
    height: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  trophyCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5A62318',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F5A62330',
    flexShrink: 0,
  },
  trophyEmoji: {
    fontSize: 22,
  },
  headerInfo: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F5A623',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  winnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  winnerEmoji: {
    fontSize: 18,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  xpBadge: {
    backgroundColor: '#F5A62318',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#F5A62330',
    alignItems: 'center',
    flexShrink: 0,
  },
  xpBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F5A623',
  },
  xpBadgeUnit: {
    fontSize: 9,
    fontWeight: '600',
    color: '#F5A623',
    letterSpacing: 0.5,
  },
  notesContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  memberRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexShrink: 0,
  },
  memberAvatarEmoji: {
    fontSize: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  speechBubble: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  noteText: {
    fontSize: 13,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  pendingNote: {
    fontSize: 14,
    color: COLORS.textTertiary,
    letterSpacing: 3,
  },
  footer: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F5A623',
  },
});
