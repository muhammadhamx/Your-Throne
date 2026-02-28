import { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSessionStore } from '@/stores/sessionStore';
import { STILL_POOPING_INTERVALS } from '@/utils/constants';
import { STILL_POOPING_MESSAGES } from '@/humor/jokes';
import { COLORS, GRADIENTS, SHADOWS, SPACING, RADIUS } from '@/utils/constants';

export function StillPoopingPopup() {
  // Subscribe directly — only this component re-renders on tick
  const isActive = useSessionStore((s) => s.isActive);
  const elapsedSeconds = useSessionStore((s) => s.elapsedSeconds);

  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [shownIntervals, setShownIntervals] = useState<Set<number>>(new Set());
  const slideAnim = useRef(new Animated.Value(320)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const prevActiveRef = useRef(isActive);

  useEffect(() => {
    if (!isActive && prevActiveRef.current) {
      setShownIntervals(new Set());
    }
    prevActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    for (const interval of STILL_POOPING_INTERVALS) {
      if (elapsedSeconds >= interval && !shownIntervals.has(interval)) {
        const msg = STILL_POOPING_MESSAGES[interval];
        if (msg) {
          setMessage(msg);
          setVisible(true);
          setShownIntervals((prev) => new Set([...prev, interval]));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        break;
      }
    }
  }, [isActive, elapsedSeconds]);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(320);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          speed: 14,
          bounciness: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 14,
          bounciness: 6,
        }),
      ]).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 320,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.popup,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Icon */}
          <View style={styles.iconCircle}>
            <Text style={styles.emoji}>🤔</Text>
          </View>

          <Text style={styles.title}>Still there?</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleDismiss}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={GRADIENTS.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Yes, still going!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  popup: {
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
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  button: {
    width: '100%',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  buttonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  buttonText: {
    color: COLORS.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
});
