import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { DrawerContentScrollView, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useCreditsStore } from '@/stores/creditsStore';
import { useLeagueStore } from '@/stores/leagueStore';
import { COLORS, GRADIENTS, SHADOWS, RADIUS, SPACING } from '@/utils/constants';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItem {
  icon: IoniconsName;
  label: string;
  route: string;
  badge?: string | number;
}

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const user = useAuthStore((s) => s.user);
  const displayName = user?.user_metadata?.display_name || 'Royal Throne User';
  const avatarEmoji = user?.user_metadata?.avatar_emoji || '👑';

  const rank = useGamificationStore((s) => s.rank);
  const xp = useGamificationStore((s) => s.xp);
  const xpProgress = useGamificationStore((s) => s.xpProgress);
  const credits = useCreditsStore((s) => s.credits);
  const leagues = useLeagueStore((s) => s.leagues);

  const menuItems: MenuItem[] = [
    { icon: 'trophy-outline', label: 'Leaderboard', route: '/leagues' },
    { icon: 'shield-outline', label: 'Leagues', route: '/leagues', badge: leagues.length || undefined },
    { icon: 'calendar-outline', label: 'Weekly Recap', route: '/(drawer)/(tabs)/stats' },
    { icon: 'diamond-outline', label: 'Credits Wallet', route: '/credits', badge: credits || undefined },
    { icon: 'cart-outline', label: 'Reward Shop', route: '/shop/' },
    { icon: 'settings-outline', label: 'Settings', route: '/settings' },
    { icon: 'information-circle-outline', label: 'About', route: '/about' },
    { icon: 'chatbubble-outline', label: 'Contact Us', route: '/contact' },
  ];

  const navigateTo = (route: string) => {
    props.navigation.closeDrawer();
    setTimeout(() => {
      router.push(route as any);
    }, 250);
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.container}
      scrollEnabled={false}
    >
      {/* Profile header */}
      <View style={styles.profileSection}>
        <View style={styles.avatarGlow}>
          <LinearGradient
            colors={GRADIENTS.accent}
            style={styles.avatarCircle}
          >
            <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
          </LinearGradient>
        </View>

        <Text style={styles.displayName} numberOfLines={1}>{displayName}</Text>

        {/* Rank badge */}
        <View style={styles.rankRow}>
          <Text style={styles.rankEmoji}>{rank.emoji}</Text>
          <Text style={styles.rankName}>{rank.name}</Text>
        </View>

        {/* XP progress bar */}
        <View style={styles.xpBarContainer}>
          <View style={styles.xpBarTrack}>
            <LinearGradient
              colors={GRADIENTS.xp}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.xpBarFill, { width: `${Math.min(xpProgress.percentage, 100)}%` as any }]}
            />
          </View>
          <Text style={styles.xpText}>
            {xp.toLocaleString()} XP
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Menu items */}
      <View style={styles.menuSection}>
        {menuItems.map((item) => (
          <Pressable
            key={item.label}
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}
            onPress={() => navigateTo(item.route)}
          >
            <View style={styles.menuIconCircle}>
              <Ionicons name={item.icon} size={20} color={COLORS.accent} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            {item.badge !== undefined && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </Pressable>
        ))}
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        <View style={styles.divider} />
        <Text style={styles.appName}>Royal Throne</Text>
        <Text style={styles.version}>Your porcelain kingdom</Text>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },

  // Profile
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  avatarGlow: {
    ...SHADOWS.glow,
    borderRadius: 40,
    marginBottom: SPACING.sm,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,212,160,0.3)',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  displayName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  rankEmoji: {
    fontSize: 16,
  },
  rankName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
  xpBarContainer: {
    width: '100%',
    gap: 4,
  },
  xpBarTrack: {
    height: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: 6,
    borderRadius: RADIUS.full,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accentWarm,
    textAlign: 'right',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
  },

  // Menu
  menuSection: {
    paddingHorizontal: SPACING.sm,
    gap: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  menuItemPressed: {
    backgroundColor: COLORS.surfaceRaised,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  badge: {
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
    marginRight: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accent,
  },

  // Bottom
  bottomSection: {
    marginTop: 'auto',
    paddingBottom: SPACING.lg,
    alignItems: 'center',
  },
  appName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
    letterSpacing: 1,
  },
  version: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
});
