import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, RADIUS } from '@/utils/constants';

interface CreditsExplainerSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

function InfoRow({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoEmoji}>{emoji}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoText}>{text}</Text>
      </View>
    </View>
  );
}

export function CreditsExplainerSheet({ visible, onDismiss }: CreditsExplainerSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onDismiss} activeOpacity={1} />
        </Animated.View>

        <Animated.View entering={SlideInDown.springify().damping(18)} style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>💎</Text>
            <Text style={styles.headerTitle}>How Credits Work</Text>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <InfoRow
              emoji="🔄"
              title="Earning Credits"
              text="Convert your hard-earned XP into credits. 50 XP = 1 credit. You can convert up to 20 credits per week — gotta keep it fair for the kingdom."
            />

            <InfoRow
              emoji="⭐"
              title="Where XP Comes From"
              text="Full sessions (+25 XP), quick logs (+10 XP), ratings (+5 XP), streaks, daily challenges, lucky poop bonuses, and mystery boxes."
            />

            <InfoRow
              emoji="🛒"
              title="Spending Credits"
              text="Visit the Reward Shop to spend credits on streak freezes, XP boosts, exclusive titles, avatar borders, and more."
            />

            <InfoRow
              emoji="⚖️"
              title="The Trade-off"
              text="Remember: XP you convert to credits won't count toward your rank. Choose wisely, ruler."
            />

            <InfoRow
              emoji="📊"
              title="Weekly Cap"
              text="You can convert a maximum of 20 credits per week. This resets every Monday. Plan your conversions!"
            />
          </ScrollView>

          {/* Close */}
          <TouchableOpacity onPress={onDismiss} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>Got it!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING['3xl'],
    maxHeight: '80%',
    ...SHADOWS.cardHigh,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textTertiary,
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  scroll: {
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  infoEmoji: {
    fontSize: 22,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  closeBtn: {
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
