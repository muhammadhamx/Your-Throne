import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/stores/authStore';
import { useCreditsStore } from '@/stores/creditsStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { COLORS, SHADOWS, CREDITS } from '@/utils/constants';

export function CreditsWalletCard() {
  const userId = useAuthStore((s) => s.user?.id);
  const credits = useCreditsStore((s) => s.credits);
  const convertXP = useCreditsStore((s) => s.convertXP);
  const xp = useGamificationStore((s) => s.xp);
  const [isConverting, setIsConverting] = useState(false);

  const canConvert = xp >= CREDITS.MIN_CONVERT_XP;
  const maxConvertableXP = Math.floor(xp / CREDITS.XP_PER_CREDIT) * CREDITS.XP_PER_CREDIT;
  const creditsFromConvert = maxConvertableXP / CREDITS.XP_PER_CREDIT;

  const handleConvert = () => {
    if (!userId || !canConvert) return;

    // Default to converting MIN amount, let user pick
    const amounts: { xp: number; credits: number }[] = [
      { xp: CREDITS.MIN_CONVERT_XP, credits: CREDITS.MIN_CONVERT_XP / CREDITS.XP_PER_CREDIT },
    ];
    if (xp >= 500) amounts.push({ xp: 500, credits: 50 });
    if (xp >= 1000) amounts.push({ xp: 1000, credits: 100 });

    const buttons: { text: string; onPress?: () => void; style?: 'cancel' | 'default' | 'destructive' }[] = amounts.map((a) => ({
      text: `${a.xp} XP → ${a.credits} Credits`,
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
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.label}>Credits</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.creditIcon}>💎</Text>
            <Text style={styles.balance}>{credits}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.convertButton, (!canConvert || isConverting) && styles.disabled]}
          onPress={handleConvert}
          disabled={!canConvert || isConverting}
          activeOpacity={0.7}
        >
          <Text style={styles.convertText}>
            {isConverting ? '...' : 'Convert XP'}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>
        {CREDITS.XP_PER_CREDIT} XP = 1 Credit · Use credits to find buddies anytime
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creditIcon: {
    fontSize: 24,
  },
  balance: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primaryLight,
    letterSpacing: -1,
  },
  convertButton: {
    backgroundColor: COLORS.accentWarm,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  convertText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  disabled: {
    opacity: 0.4,
  },
  hint: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 10,
  },
});
