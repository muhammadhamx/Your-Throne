import { type ReactNode } from 'react';
import { Pressable, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, GRADIENTS, SHADOWS, SPACING, RADIUS } from '@/utils/constants';

interface AnimatedButtonProps {
  onPress: () => void;
  label?: string;
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  gradient?: readonly [string, string, ...string[]];
  disabled?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function AnimatedButton({
  onPress,
  label,
  children,
  variant = 'primary',
  gradient,
  disabled = false,
  haptic = true,
  style,
  textStyle,
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return [styles.button, styles.primary, style];
      case 'secondary':
        return [styles.button, styles.secondary, style];
      case 'outline':
        return [styles.button, styles.outline, style];
      case 'ghost':
        return [styles.button, styles.ghost, style];
      default:
        return [styles.button, style];
    }
  };

  const getLabelStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.label, styles.secondaryLabel, textStyle];
      case 'outline':
        return [styles.label, styles.outlineLabel, textStyle];
      case 'ghost':
        return [styles.label, styles.ghostLabel, textStyle];
      default:
        return [styles.label, textStyle];
    }
  };

  const content = children || (label ? <Text style={getLabelStyle()}>{label}</Text> : null);

  if (variant === 'gradient') {
    const gradientColors = gradient ?? (GRADIENTS.button as readonly [string, string, ...string[]]);
    return (
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <Animated.View style={[animatedStyle, disabled && styles.disabled]}>
          <LinearGradient
            colors={gradientColors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.button, styles.gradientButton, style]}
          >
            {children || (label ? (
              <Text style={[styles.label, textStyle]}>{label}</Text>
            ) : null)}
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[getButtonStyle(), animatedStyle, disabled && styles.disabled]}>
        {content}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  primary: {
    backgroundColor: COLORS.accent,
    ...SHADOWS.glow,
  },
  secondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  gradientButton: {
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  label: {
    color: COLORS.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryLabel: {
    color: COLORS.text,
  },
  outlineLabel: {
    color: COLORS.accent,
  },
  ghostLabel: {
    color: COLORS.accent,
  },
});
