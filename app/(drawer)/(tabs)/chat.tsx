import { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useChatStore } from '@/stores/chatStore';
import { useCreditsStore } from '@/stores/creditsStore';
import { getRandomItem, EMPTY_STATE_MESSAGES, BUDDY_ICEBREAKERS } from '@/humor/jokes';
import { COLORS, GRADIENTS, SHADOWS, RADIUS, SPACING, CREDITS } from '@/utils/constants';

export default function ChatScreen() {
  const user = useAuthStore((s) => s.user);
  const isInSession = useSessionStore((s) => s.isActive);
  const credits = useCreditsStore((s) => s.credits);
  const spendOnBuddyMatch = useCreditsStore((s) => s.spendOnBuddyMatch);
  const loadCredits = useCreditsStore((s) => s.loadCredits);
  const {
    rooms,
    currentMatch,
    isSearchingBuddy,
    activePoopersCount,
    error,
    loadRooms,
    startSearching,
    stopSearching,
    checkActiveMatch,
    subscribeToPresence,
    unsubscribeFromPresence,
  } = useChatStore();

  useEffect(() => {
    loadRooms();
    if (user?.id) {
      checkActiveMatch(user.id);
      loadCredits(user.id);
    }
  }, [user?.id, loadRooms, checkActiveMatch, loadCredits]);

  useEffect(() => {
    if (user?.id && isInSession) {
      subscribeToPresence(user.id);
    }
    return () => {
      unsubscribeFromPresence();
    };
  }, [user?.id, isInSession, subscribeToPresence, unsubscribeFromPresence]);

  const wasSearching = useRef(false);
  useEffect(() => {
    if (isSearchingBuddy) wasSearching.current = true;
  }, [isSearchingBuddy]);

  useEffect(() => {
    if (currentMatch && wasSearching.current) {
      wasSearching.current = false;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push(`/chat/buddy/${currentMatch.id}`);
    }
  }, [currentMatch]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  }, [loadRooms]);

  const canUseCredits = !isInSession && credits >= CREDITS.BUDDY_MATCH_COST;

  const handleFindBuddy = async () => {
    if (!user?.id) return;
    if (isSearchingBuddy) {
      await stopSearching(user.id);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await startSearching(user.id);
    }
  };

  const handleFindBuddyWithCredits = async () => {
    if (!user?.id) return;
    if (isSearchingBuddy) {
      await stopSearching(user.id);
      return;
    }

    Alert.alert(
      'Use Credits',
      `Spend ${CREDITS.BUDDY_MATCH_COST} credits to search for a poop buddy without a session?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Use ${CREDITS.BUDDY_MATCH_COST} Credits`,
          onPress: async () => {
            try {
              const success = await spendOnBuddyMatch(user.id);
              if (success) {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await startSearching(user.id);
              } else {
                Alert.alert('Not Enough Credits', 'You need more credits. Convert XP on the home screen.');
              }
            } catch {
              Alert.alert('Error', 'Failed to spend credits.');
            }
          },
        },
      ]
    );
  };

  return (
    <FlatList
      style={styles.container}
      data={isInSession ? rooms : []}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <Animated.View entering={FadeInDown.delay(index * 60).duration(400).springify()}>
          <TouchableOpacity
            style={styles.roomCard}
            onPress={() => router.push(`/chat/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.roomIconCircle}>
              <Text style={styles.roomEmoji}>💬</Text>
            </View>
            <View style={styles.roomInfo}>
              <Text style={styles.roomName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.roomDescription} numberOfLines={1}>
                  {item.description}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </Animated.View>
      )}
      ListHeaderComponent={
        <View>
          {/* Active poopers bar */}
          <View style={styles.activePill}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>
              {activePoopersCount} pooper{activePoopersCount !== 1 ? 's' : ''} online
            </Text>
          </View>

          {/* Error */}
          {error && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.errorBar}>
              <Ionicons name="alert-circle-outline" size={14} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={onRefresh}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Buddy section */}
          <View style={styles.buddySection}>
            {currentMatch ? (
              // Active match card
              <Animated.View entering={FadeInDown.duration(400).springify()}>
                <TouchableOpacity
                  style={styles.activeMatchCard}
                  onPress={() => router.push(`/chat/buddy/${currentMatch.id}`)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#1A3A5C', '#1E4976']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.activeMatchGradient}
                  >
                    <View style={styles.activeMatchIcon}>
                      <Text style={styles.activeMatchEmoji}>🤝</Text>
                    </View>
                    <View style={styles.activeMatchInfo}>
                      <Text style={styles.activeMatchTitle}>Active Poop Buddy</Text>
                      <Text style={styles.activeMatchSub}>Tap to continue chatting</Text>
                    </View>
                    <View style={styles.activeMatchArrow}>
                      <Ionicons name="arrow-forward" size={18} color="rgba(240,246,255,0.7)" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ) : isInSession ? (
              // Find buddy button (in session)
              <TouchableOpacity
                style={styles.findBuddyBtn}
                onPress={handleFindBuddy}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={isSearchingBuddy ? GRADIENTS.primary : GRADIENTS.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.findBuddyGradient}
                >
                  {isSearchingBuddy ? (
                    <>
                      <ActivityIndicator color="rgba(240,246,255,0.8)" size="small" />
                      <Text style={[styles.findBuddyText, styles.findBuddySearchText]}>
                        Finding your buddy...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.findBuddyEmoji}>🔍</Text>
                      <Text style={styles.findBuddyText}>Find a Poop Buddy</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              // Not in session
              <View style={styles.noSessionSection}>
                <View style={styles.noSessionCard}>
                  <View style={styles.noSessionIconBg}>
                    <Text style={styles.noSessionIcon}>🔒</Text>
                  </View>
                  <View style={styles.noSessionInfo}>
                    <Text style={styles.noSessionTitle}>Start a session to find buddies</Text>
                    <Text style={styles.noSessionSub}>
                      {canUseCredits ? 'Or use credits to search anytime' : 'Sit on the throne first'}
                    </Text>
                  </View>
                </View>

                {canUseCredits && (
                  <TouchableOpacity
                    style={styles.creditBtn}
                    onPress={handleFindBuddyWithCredits}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={isSearchingBuddy ? GRADIENTS.primary : GRADIENTS.buttonWarm}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.creditBtnGradient}
                    >
                      {isSearchingBuddy ? (
                        <>
                          <ActivityIndicator color="rgba(240,246,255,0.8)" size="small" />
                          <Text style={[styles.creditBtnText, { color: 'rgba(240,246,255,0.9)' }]}>
                            Searching...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.creditBtnEmoji}>💎</Text>
                          <Text style={styles.creditBtnText}>
                            Use {CREDITS.BUDDY_MATCH_COST} Credits
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Group rooms section title */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Group Rooms</Text>
            {!isInSession && (
              <View style={styles.lockedBadge}>
                <Ionicons name="lock-closed" size={11} color={COLORS.textTertiary} />
                <Text style={styles.lockedText}>Session required</Text>
              </View>
            )}
          </View>

          {/* Gated or empty state */}
          {!isInSession && (
            <View style={styles.gatedContainer}>
              <Text style={styles.gatedText}>
                Start a session to access group chat rooms
              </Text>
            </View>
          )}

          {isInSession && rooms.length === 0 && (
            <View style={styles.emptyRooms}>
              <Text style={styles.emptyRoomsText}>
                {getRandomItem(EMPTY_STATE_MESSAGES.chat)}
              </Text>
            </View>
          )}
        </View>
      }
      contentContainerStyle={styles.listContent}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: SPACING['2xl'],
  },

  // Active poopers
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.success,
  },
  activeText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  // Error bar
  errorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.errorBg,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error + '25',
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.error,
  },
  retryText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '700',
  },

  // Buddy section
  buddySection: {
    padding: SPACING.md,
    paddingBottom: 0,
  },

  // Active match
  activeMatchCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.cardElevated,
  },
  activeMatchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.lg,
  },
  activeMatchIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,212,160,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeMatchEmoji: {
    fontSize: 22,
  },
  activeMatchInfo: {
    flex: 1,
  },
  activeMatchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activeMatchSub: {
    fontSize: 12,
    color: 'rgba(240,246,255,0.55)',
    marginTop: 2,
  },
  activeMatchArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Find buddy
  findBuddyBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  findBuddyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  findBuddyEmoji: {
    fontSize: 20,
  },
  findBuddyText: {
    color: COLORS.primaryDark,
    fontSize: 16,
    fontWeight: '800',
  },
  findBuddySearchText: {
    color: 'rgba(240,246,255,0.9)',
  },

  // No session
  noSessionSection: {
    gap: SPACING.xs,
  },
  noSessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  noSessionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSessionIcon: {
    fontSize: 18,
  },
  noSessionInfo: {
    flex: 1,
  },
  noSessionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  noSessionSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Credits button
  creditBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.glowWarm,
  },
  creditBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  creditBtnEmoji: {
    fontSize: 18,
  },
  creditBtnText: {
    color: COLORS.primaryDark,
    fontSize: 15,
    fontWeight: '800',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  lockedText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },

  // Gated / empty
  gatedContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING['2xl'],
  },
  gatedText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyRooms: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
  },
  emptyRoomsText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Room card
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
  },
  roomIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  roomEmoji: {
    fontSize: 18,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  roomDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
