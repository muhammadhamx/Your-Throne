import { View, StyleSheet } from 'react-native';
import { CreditsWalletCard } from '@/components/home/CreditsWalletCard';
import { COLORS, SPACING } from '@/utils/constants';

export default function CreditsScreen() {
  return (
    <View style={styles.container}>
      <CreditsWalletCard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: SPACING.md,
  },
});
