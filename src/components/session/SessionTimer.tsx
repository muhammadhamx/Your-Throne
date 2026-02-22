import { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { formatTimerDisplay } from '@/utils/formatters';
import { COLORS } from '@/utils/constants';

interface Props {
  isActive: boolean;
  elapsedSeconds: number;
  onStart: () => void;
  onStop: () => void;
}

export function SessionTimer({ isActive, elapsedSeconds, onStart, onStop }: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isActive) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timerText}>
        {formatTimerDisplay(elapsedSeconds)}
      </Text>

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.button, isActive ? styles.stopButton : styles.startButton]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <Text style={styles.buttonEmoji}>{isActive ? '🛑' : '🚽'}</Text>
          <Text style={styles.buttonText}>
            {isActive ? 'End Session' : 'Start Session'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {isActive && (
        <Text style={styles.hint}>Tap to end when you're done</Text>
      )}
      {!isActive && (
        <Text style={styles.hint}>Tap when you sit on the throne</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  timerText: {
    fontSize: 64,
    fontWeight: '200',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 40,
    minWidth: 220,
    gap: 12,
  },
  startButton: {
    backgroundColor: COLORS.primary,
  },
  stopButton: {
    backgroundColor: COLORS.error,
  },
  buttonEmoji: {
    fontSize: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  hint: {
    marginTop: 16,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
