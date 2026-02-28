import { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/stores/authStore';
import { useShopStore } from '@/stores/shopStore';
import { useCreditsStore } from '@/stores/creditsStore';
import type { ShopItem } from '@/types/database';
import { COLORS, GRADIENTS, SHADOWS, SPACING, RADIUS } from '@/utils/constants';

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  functional: { label: 'Power-Ups', emoji: '⚡' },
  title: { label: 'Exclusive Titles', emoji: '👑' },
  border: { label: 'Avatar Borders', emoji: '💠' },
  fun: { label: 'Fun Stuff', emoji: '🎉' },
};

const CATEGORY_ORDER = ['functional', 'title', 'border', 'fun'];

interface SectionItem {
  type: 'header' | 'item';
  category?: string;
  item?: ShopItem;
}

function ShopItemCard({
  item,
  owned,
  credits,
  onPurchase,
}: {
  item: ShopItem;
  owned: boolean;
  credits: number;
  onPurchase: () => void;
}) {
  const canAfford = credits >= item.price;
  const isDisabled = owned && !item.is_repeatable;

  return (
    <Animated.View entering={FadeInDown.springify().damping(18)}>
      <View style={[styles.itemCard, isDisabled && styles.itemCardOwned]}>
        <View style={styles.itemRow}>
          <View style={styles.itemEmojiCircle}>
            <Text style={styles.itemEmoji}>{item.emoji}</Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDesc}>{item.description}</Text>
          </View>
          {isDisabled ? (
            <View style={styles.ownedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.accent} />
              <Text style={styles.ownedText}>Owned</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={onPurchase}
              disabled={!canAfford}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={canAfford ? GRADIENTS.buttonWarm : ['#2A3A4A', '#1E2B3A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.priceBtn}
              >
                <Text style={styles.priceBtnIcon}>💎</Text>
                <Text style={[styles.priceBtnText, !canAfford && styles.priceBtnTextDisabled]}>
                  {item.price}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
        {item.is_repeatable && !isDisabled && (
          <Text style={styles.repeatableLabel}>Can purchase multiple times</Text>
        )}
      </View>
    </Animated.View>
  );
}

export default function ShopScreen() {
  const userId = useAuthStore((s) => s.user?.id);
  const { items, ownedItems, isLoading, loadShop, purchase } = useShopStore();
  const credits = useCreditsStore((s) => s.credits);
  const [refreshing, setRefreshing] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

  useEffect(() => {
    if (userId) loadShop(userId);
  }, [userId, loadShop]);

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    await loadShop(userId);
    setRefreshing(false);
  }, [userId, loadShop]);

  const handlePurchase = (item: ShopItem) => {
    if (!userId) return;
    const isOwned = ownedItems.includes(item.id) && !item.is_repeatable;
    if (isOwned) return;

    Alert.alert(
      `Buy ${item.name}?`,
      `This will cost ${item.price} credits.\n\n${item.description}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Buy for ${item.price} 💎`,
          onPress: async () => {
            try {
              await purchase(userId, item.id);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Purchased!', `${item.emoji} ${item.name} is now yours!`);
            } catch (err: any) {
              Alert.alert('Purchase Failed', err?.message || 'Something went wrong');
            }
          },
        },
      ]
    );
  };

  // Build section list data
  const sections: SectionItem[] = [];
  CATEGORY_ORDER.forEach((cat) => {
    const catItems = items.filter((i) => i.category === cat);
    if (catItems.length === 0) return;
    sections.push({ type: 'header', category: cat });
    catItems.forEach((item) => sections.push({ type: 'item', item }));
  });

  const renderItem = useCallback(
    ({ item: row }: { item: SectionItem }) => {
      if (row.type === 'header' && row.category) {
        const cat = CATEGORY_LABELS[row.category];
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>{cat?.emoji}</Text>
            <Text style={styles.sectionTitle}>{cat?.label}</Text>
          </View>
        );
      }
      if (row.type === 'item' && row.item) {
        return (
          <ShopItemCard
            item={row.item}
            owned={ownedItems.includes(row.item.id)}
            credits={credits}
            onPurchase={() => handlePurchase(row.item!)}
          />
        );
      }
      return null;
    },
    [ownedItems, credits, handlePurchase]
  );

  const keyExtractor = useCallback(
    (item: SectionItem, index: number) =>
      item.type === 'header' ? `header-${item.category}` : `item-${item.item?.id ?? index}`,
    []
  );

  const ListHeader = (
    <Animated.View entering={FadeInDown.delay(50).springify().damping(18)}>
      {/* Credits balance */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceIcon}>💎</Text>
          <View>
            <Text style={styles.balanceLabel}>Your Credits</Text>
            <Text style={styles.balanceValue}>{credits.toLocaleString()}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setShowExplainer(true)}
          style={styles.infoBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="help-circle-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // Lazy-load explainer
  const CreditsExplainerSheet = showExplainer
    ? require('@/components/credits/CreditsExplainerSheet').CreditsExplainerSheet
    : null;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Reward Shop',
          headerStyle: { backgroundColor: COLORS.background },
          headerShadowVisible: false,
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '800', fontSize: 17, color: COLORS.text },
        }}
      />

      <FlatList
        data={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
      />

      {CreditsExplainerSheet && (
        <CreditsExplainerSheet
          visible={showExplainer}
          onDismiss={() => setShowExplainer(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    padding: SPACING.md,
    paddingBottom: SPACING['2xl'],
    gap: SPACING.xs,
  },
  balanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  balanceIcon: {
    fontSize: 28,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primaryLight,
  },
  infoBtn: {
    padding: SPACING.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  sectionEmoji: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  itemCardOwned: {
    opacity: 0.7,
    borderColor: COLORS.accent + '30',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  itemEmojiCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexShrink: 0,
  },
  itemEmoji: {
    fontSize: 20,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  priceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  priceBtnIcon: {
    fontSize: 12,
  },
  priceBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  priceBtnTextDisabled: {
    color: COLORS.textTertiary,
  },
  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  ownedText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  repeatableLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
});
