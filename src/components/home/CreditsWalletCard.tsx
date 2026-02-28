import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/stores/authStore';
import { useCreditsStore } from '@/stores/creditsStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { COLORS, GRADIENTS, SHADOWS, RADIUS, SPACING } from '@/utils/constants';

export function CreditsWalletCard() {
  const userId = useAuthStore((s) => s.user?.id);
  const credits = useCreditsStore((s) => s.credits);
  const convertXP = useCreditsStore((s) => s.convertXP);
  const xp = useGamificationStore((s) => s.xp);
  const [isConverting, setIsConverting] = useState(false);

  const CREDITS_CONFIG = { MIN_CONVERT_XP: 100, XP_PER_CREDIT: 10 };
  const canConvert = xp >= CREDITS_CONFIG.MIN_CONVERT_XP;

  const handleConvert = () => {
    if (!userId || !canConvert) return;

    const amounts: { xp: number; credits: number }[] = [
      { xp: CREDITS_CONFIG.MIN_CONVERT_XP, credits: CREDITS_CONFIG.MIN_CONVERT_XP / CREDITS_CONFIG.XP_PER_CREDIT },
    ];
    if (xp >= 500) amounts.push({ xp: 500, credits: 50 });
    if (xp >= 1000) amounts.push({ xp: 1000, credits: 100 });

    const buttons: { text: string; onPress?: () => void; style?: 'cancel' | 'default' | 'destructive' }[] = amounts.map((a) => ({
      text: `${a.xp} XP  →  ${a.credits} Credits`,
      onPress: async () => {
        setIsConverting(true);
        try {
          await convertXP(userId, a.xp);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          Alert.alert('Error', 'Failed to convert XP.');
        } finally {
          setIsConverting(false);
        }
      },
    }));
    buttons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(
      'Convert XP to Credits',
      `You have ${xp} XP. Choose how much to convert:`,
      buttons
    );
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(500).springify()}
      style={styles.card}
    >
      <View style={styles.row}>
        {/* Credits balance */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Credits Wallet</Text>
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
        10 XP = 1 Credit  ·  Use credits to find buddies anytime
      </Text>
    </Animated.View>
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
    marginBottom: 4,
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
  convertBtnDisabled: {
    // gradient handles this
  },
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
});
