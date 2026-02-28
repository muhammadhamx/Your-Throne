import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { getPopupContent, getDismissText } from '@/humor/sessionPopups';
import { COLORS, GRADIENTS, SHADOWS, SPACING, RADIUS } from '@/utils/constants';

interface Props {
  isActive: boolean;
}

export function SessionStartPopup({ isActive }: Props) {
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(false);
  const [content, setContent] = useState(() => getPopupContent(0));
  const [dismissText, setDismissText] = useState(() => getDismissText());

  const translateY = useSharedValue(320);
  const backdropOpacity = useSharedValue(0);

  const router = useRouter();
  const activePoopersCount = useChatStore((s) => s.activePoopersCount);
  const currentMatch = useChatStore((s) => s.currentMatch);
  const user = useAuthStore((s) => s.user);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(320, { duration: 250 });
    backdropOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setVisible)(false);
    });
  }, [translateY, backdropOpacity]);

  // Show popup 2s after session starts
  useEffect(() => {
    if (isActive && !shown && !currentMatch) {
      const timer = setTimeout(() => {
        setContent(getPopupContent(activePoopersCount));
        setDismissText(getDismissText());
        setVisible(true);
        setShown(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
        backdropOpacity.value = withTiming(1, { duration: 300 });
      }, 2000);

      return () => clearTimeout(timer);
    }

    // Reset when session ends
    if (!isActive) {
      setShown(false);
      setVisible(false);
    }
  }, [isActive, shown, currentMatch, activePoopersCount, translateY, backdropOpacity]);

  const handleFindBuddy = () => {
    dismiss();
    if (user?.id) {
      useChatStore.getState().startSearching(user.id);
    }
    router.push('/(drawer)/(tabs)/chat');
  };

  const handleJoinChat = () => {
    dismiss();
    router.push('/(drawer)/(tabs)/chat');
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value * 0.5,
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </Pressable>

      <Animated.View style={[styles.sheet, sheetStyle]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Emoji */}
        <View style={styles.emojiCircle}>
          <Text style={styles.emoji}>{content.emoji}</Text>
        </View>

        <Text style={styles.message}>{content.message}</Text>

        {activePoopersCount > 1 && (
          <View style={styles.poopersBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.poopersCount}>
              {activePoopersCount} poopers online now
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          {/* Find buddy */}
          <TouchableOpacity
            style={styles.primaryActionWrapper}
            onPress={handleFindBuddy}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={GRADIENTS.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryAction}
            >
              <Ionicons name="people-outline" size={18} color={COLORS.primaryDark} />
              <Text style={styles.primaryActionText}>Find a Poop Buddy</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Join chat */}
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={handleJoinChat}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubbles-outline" size={18} color={COLORS.text} />
            <Text style={styles.secondaryActionText}>Join the Chat</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.dismissAction}
          onPress={dismiss}
          activeOpacity={0.7}
        >
          <Text style={styles.dismissText}>{dismissText}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING['3xl'],
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.cardElevated,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  emojiCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  emoji: {
    fontSize: 34,
  },
  message: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    lineHeight: 26,
  },
  poopersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.accent + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.accent + '25',
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.accent,
  },
  poopersCount: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  primaryActionWrapper: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  primaryActionText: {
    color: COLORS.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryActionText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  dismissAction: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  dismissText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
});
