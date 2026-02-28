import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  FadeInUp,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { LOADING_MESSAGES, getRandomItem } from '@/humor/jokes';
import { COLORS, GRADIENTS, SHADOWS, RADIUS, SPACING, TYPOGRAPHY } from '@/utils/constants';

const FEATURE_ITEMS = [
  { emoji: '📊', label: 'Track Sessions' },
  { emoji: '🔮', label: 'Predict Patterns' },
  { emoji: '🔥', label: 'Build Streaks' },
  { emoji: '💬', label: 'Find Buddies' },
];

export default function WelcomeScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showSignIn, setShowSignIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Floating crown animation
  const floatY = useSharedValue(0);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [floatY, glowScale]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: interpolate(glowScale.value, [1, 1.15], [0.3, 0.55]),
  }));

  useEffect(() => {
    if (!loading) return;
    setLoadingMessage(getRandomItem(LOADING_MESSAGES));
    const interval = setInterval(() => {
      setLoadingMessage(getRandomItem(LOADING_MESSAGES));
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleGetStarted = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn();
      router.replace('/(drawer)/(tabs)/session');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email.trim(), password.trim());
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        await useGamificationStore.getState().restoreFromRemote(userId);
      }
      router.replace('/(drawer)/(tabs)/session');
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('Invalid login')) {
        setError('Invalid email or password.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Please confirm your email before signing in.');
      } else if (msg.includes('rate') || msg.includes('limit')) {
        setError('Too many attempts. Please wait a moment.');
      } else if (msg) {
        setError(msg);
      } else {
        setError('Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#060A11', '#0A1020', '#0D1728']}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient glow orbs */}
      <Animated.View style={[styles.glowOrb, styles.glowOrb1, glowStyle]} />
      <View style={[styles.glowOrb, styles.glowOrb2]} />

      <View style={styles.heroSection}>
        {/* Crown/logo */}
        <Animated.View style={[styles.logoWrapper, floatStyle]}>
          <View style={styles.logoGlow} />
          <LinearGradient
            colors={['#00D4A0', '#00B589']}
            style={styles.logoCircle}
          >
            <Text style={styles.logoEmoji}>👑</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600).springify()}>
          <Text style={styles.title}>Royal Throne</Text>
          <Text style={styles.subtitle}>
            Your porcelain kingdom awaits.{'\n'}Track. Predict. Conquer.
          </Text>
        </Animated.View>

        {/* Feature chips */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(600).springify()}
          style={styles.featuresRow}
        >
          {FEATURE_ITEMS.map((f, i) => (
            <Animated.View
              key={f.label}
              entering={FadeInDown.delay(550 + i * 80).duration(500).springify()}
              style={styles.featureChip}
            >
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </Animated.View>
          ))}
        </Animated.View>
      </View>

      {/* Bottom action area */}
      <Animated.View
        entering={FadeInUp.delay(700).duration(600).springify()}
        style={styles.bottomSection}
      >
        {/* Error message */}
        {error && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}

        {/* Loading message */}
        {loading && (
          <Text style={styles.loadingMessage}>{loadingMessage}</Text>
        )}

        {showSignIn ? (
          <View style={styles.signInForm}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor={COLORS.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View style={[styles.inputWrapper, { marginTop: SPACING.xs }]}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={COLORS.textTertiary}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <Pressable
                style={styles.passwordToggle}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={COLORS.textSecondary}
                />
              </Pressable>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleEmailSignIn}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={GRADIENTS.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchLink}
              onPress={() => { setShowSignIn(false); setError(null); }}
              disabled={loading}
            >
              <Text style={styles.switchLinkText}>New here? Start anonymously</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleGetStarted}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={GRADIENTS.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Preparing your royal throne...' : 'Start for Free'}
                </Text>
                {!loading && (
                  <Ionicons name="arrow-forward" size={20} color={COLORS.primaryDark} />
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.privacyNote}>
              No account needed. Completely anonymous.
            </Text>

            <TouchableOpacity
              style={styles.signInLink}
              onPress={() => { setShowSignIn(true); setError(null); }}
              disabled={loading}
            >
              <Text style={styles.signInLinkText}>Already have an account? </Text>
              <Text style={styles.signInLinkAccent}>Sign in</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: RADIUS.full,
  },
  glowOrb1: {
    width: 280,
    height: 280,
    backgroundColor: COLORS.accent,
    top: -100,
    right: -80,
    opacity: 0.06,
  },
  glowOrb2: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.primaryLight,
    bottom: 100,
    left: -80,
    opacity: 0.04,
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
    paddingTop: 60,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.accent,
    opacity: 0.12,
    top: -12,
    left: -12,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow,
  },
  logoEmoji: {
    fontSize: 44,
  },
  title: {
    ...TYPOGRAPHY.displayMd,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyLg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xl,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceRaised,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  featureEmoji: {
    fontSize: 14,
  },
  featureLabel: {
    ...TYPOGRAPHY.labelMd,
    color: COLORS.textSecondary,
  },
  bottomSection: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 48 : SPACING['2xl'],
    paddingTop: SPACING.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.errorBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
    marginBottom: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.labelLg,
    color: COLORS.error,
    flex: 1,
  },
  loadingMessage: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
  buttonGroup: {
    gap: 0,
  },
  primaryButton: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: SPACING['2xl'],
    gap: SPACING.xs,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.h5,
    color: COLORS.primaryDark,
    fontWeight: '800',
    fontSize: 17,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  privacyNote: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  signInLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  signInLinkText: {
    ...TYPOGRAPHY.labelLg,
    color: COLORS.textSecondary,
  },
  signInLinkAccent: {
    ...TYPOGRAPHY.labelLg,
    color: COLORS.accent,
    fontWeight: '700',
  },
  signInForm: {
    gap: 0,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.xs,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 15,
    color: COLORS.text,
  },
  passwordInput: {
    paddingRight: 36,
  },
  passwordToggle: {
    position: 'absolute',
    right: SPACING.md,
    padding: 4,
  },
  switchLink: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  switchLinkText: {
    ...TYPOGRAPHY.labelLg,
    color: COLORS.accent,
  },
});
