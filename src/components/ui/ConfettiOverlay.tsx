import { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width } = Dimensions.get('window');

export interface ConfettiRef {
  fire: () => void;
}

export const ConfettiOverlay = forwardRef<ConfettiRef>(function ConfettiOverlay(_, ref) {
  const confettiRef = useRef<ConfettiCannon>(null);
  const [show, setShow] = useState(false);

  useImperativeHandle(ref, () => ({
    fire: () => {
      setShow(true);
    },
  }));

  if (!show) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <ConfettiCannon
        ref={confettiRef}
        count={80}
        origin={{ x: width / 2, y: -20 }}
        autoStart
        fadeOut
        fallSpeed={3000}
        explosionSpeed={400}
        colors={['#00D4A0', '#F5A623', '#5EEFC8', '#60A5FA', '#FBBF24', '#F0F6FF']}
        onAnimationEnd={() => setShow(false)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});
