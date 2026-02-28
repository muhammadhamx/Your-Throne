import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useCreditsStore } from '@/stores/creditsStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { CREDITS, COLORS, GRADIENTS, SHADOWS, RADIUS, SPACING } from '@/utils/constants';

export function CreditsWalletCard() {
  const userId = useAuthStore((s) => s.user?.id);
  const credits = useCreditsStore((s) => s.credits);
  const weeklyConverted = useCreditsStore((s) => s.weeklyConverted);
  const convertXP = useCreditsStore((s) => s.convertXP);
  const loadWeeklyCap = useCreditsStore((s) => s.loadWeeklyCap);
  const xp = useGamificationStore((s) => s.xp);
  const [isConverting, setIsConverting] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

  const canConvert = xp >= CREDITS.MIN_CONVERT_XP;
  const weeklyRemaining = CREDITS.WEEKLY_CONVERT_CAP - weeklyConverted;

  const handleConvert = () => {
    if (!userId || !canConvert) return;

    // Load weekly cap first
    loadWeeklyCap(userId);

    const presets = CREDITS.CONVERT_PRESETS.filter(
      (p) => xp >= p.xp && p.credits <= weeklyRemaining
    );

    if (presets.length === 0) {
      if (weeklyRemaining <= 0) {
        Alert.alert('Weekly Cap Reached', 'You can convert up to 20 credits per week. Resets on Monday!');
      } else {
        Alert.alert('Not Enough XP', `You need at least ${CREDITS.MIN_CONVERT_XP} XP to convert.`);
      }
      return;
    }

    const buttons: { text: string; onPress?: () => void; style?: 'cancel' | 'default' | 'destructive' }[] = presets.map((p) => ({
      text: `${p.xp} XP  →  ${p.credits} Credits`,
      onPress: async () => {
        setIsConverting(true);
        try {
          await convertXP(userId, p.xp);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err: any) {
          Alert.alert('Error', err?.message || 'Failed to convert XP.');
        } finally {
          setIsConverting(false);
        }
      },
    }));
    buttons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(
      'Convert XP to Credits',
      `You have ${xp.toLocaleString()} XP.\n${weeklyRemaining} credits remaining this week.`,
      buttons
    );
  };

  // Lazy-load explainer
  const CreditsExplainerSheet = showExplainer
    ? require('@/components/credits/CreditsExplainerSheet').CreditsExplainerSheet
    : null;

  return (
    <>
      <Animated.View
        entering={FadeInDown.delay(200).duration(500).springify()}
        style={styles.card}
      >
        {/* Header row with info button */}
        <View style={styles.headerRow}>
          <Text style={styles.balanceLabel}>Credits Wallet</Text>
          <TouchableOpacity onPress={() => setShowExplainer(true)} hitSlop={8}>
            <Ionicons name="help-circle-outline" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          {/* Credits balance */}
          <View style={styles.balanceSection}>
            <View style={styles.balanceRow}>
              <Text style={styles.creditIcon}>💎</Text>
              <Text style={styles.balance}>{credits}</Text>
            </View>
          </View>

          {/* XP info */}
          <View style={styles.xpSection}>
            <Text style={styles.xpLabel}>Available XP</Text>
            <Text style={styles.xpValue}>{xp.toLocaleString()}</Text>
          </View>

          {/* Convert button */}
          <TouchableOpacity
            onPress={handleConvert}
            disabled={!canConvert || isConverting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={canConvert && !isConverting ? GRADIENTS.buttonWarm : ['#2A3A4A', '#1E2B3A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.convertBtn, (!canConvert || isConverting) && styles.convertBtnDisabled]}
            >
              <Text style={[styles.convertText, (!canConvert || isConverting) && styles.convertTextDisabled]}>
                {isConverting ? '...' : 'Convert\nXP'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          50 XP = 1 Credit  ·  {weeklyRemaining} credits left this week
        </Text>

        {/* Visit Shop button */}
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => router.push('/shop/')}
          activeOpacity={0.7}
        >
          <Ionicons name="cart-outline" size={14} color={COLORS.accent} />
          <Text style={styles.shopBtnText}>Visit Reward Shop</Text>
          <Ionicons name="chevron-forward" size={12} color={COLORS.accent} />
        </TouchableOpacity>
      </Animated.View>

      {CreditsExplainerSheet && (
        <CreditsExplainerSheet
          visible={showExplainer}
          onDismiss={() => setShowExplainer(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  balanceSection: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creditIcon: {
    fontSize: 20,
  },
  balance: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primaryLight,
    letterSpacing: -0.5,
  },
  xpSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  xpLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  xpValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.accentWarm,
  },
  convertBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    minWidth: 62,
  },
  convertBtnDisabled: {},
  convertText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
    textAlign: 'center',
    lineHeight: 16,
  },
  convertTextDisabled: {
    color: COLORS.textTertiary,
  },
  hint: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
  },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.accent + '10',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.accent + '20',
  },
  shopBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
