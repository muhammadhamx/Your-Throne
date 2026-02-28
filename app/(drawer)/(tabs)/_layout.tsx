import { useEffect, memo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { COLORS, GRADIENTS, SHADOWS, RADIUS, ANIMATION } from '@/utils/constants';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabMeta {
  label: string;
  icon: IoniconsName;
  iconFocused: IoniconsName;
}

const TAB_META: Record<string, TabMeta> = {
  session: { label: 'Royal Throne', icon: 'home-outline', iconFocused: 'home' },
  stats: { label: 'Stats', icon: 'stats-chart-outline', iconFocused: 'stats-chart' },
  predict: { label: 'Predict', icon: 'sparkles-outline', iconFocused: 'sparkles' },
  chat: { label: 'Chat', icon: 'chatbubble-ellipses-outline', iconFocused: 'chatbubble-ellipses' },
};

// ─── Single animated tab item ────────────────────────────────────────────────

const TabItem = memo(function TabItem({
  routeName,
  focused,
  onPress,
  onLongPress,
}: {
  routeName: string;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const meta = TAB_META[routeName];
  if (!meta) return null;

  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, ANIMATION.spring);
  }, [focused, progress]);

  // Pill scale/opacity
  const pillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.4, 1]),
    transform: [
      { scaleX: interpolate(progress.value, [0, 1], [0.5, 1]) },
      { scaleY: interpolate(progress.value, [0, 1], [0.7, 1]) },
    ],
  }));

  // Icon scale bounce
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.18, 1]) },
      { translateY: interpolate(progress.value, [0, 1], [0, -1]) },
    ],
  }));

  // Label slide-in
  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.4, 1], [0, 1]),
    maxWidth: interpolate(progress.value, [0, 1], [0, 72]),
    marginLeft: interpolate(progress.value, [0, 1], [0, 5]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-6, 0]) },
    ],
  }));

  // Indicator dot under inactive tabs
  const dotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [0, 1]) * (1 - progress.value),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [1, 0]) },
    ],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
    >
      {/* Animated pill background */}
      <Animated.View style={[styles.pillContainer, pillStyle]}>
        <LinearGradient
          colors={GRADIENTS.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pill}
        />
      </Animated.View>

      {/* Icon + label row */}
      <View style={styles.contentRow} pointerEvents="none">
        <Animated.View style={iconStyle}>
          <Ionicons
            name={focused ? meta.iconFocused : meta.icon}
            size={21}
            color={focused ? COLORS.primaryDark : COLORS.textTertiary}
          />
        </Animated.View>
        <Animated.Text style={[styles.label, labelStyle]} numberOfLines={1}>
          {meta.label}
        </Animated.Text>
      </View>
    </Pressable>
  );
});

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.barOuter}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <TabItem
              key={route.key}
              routeName={route.name}
              focused={focused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabsLayout() {
  const navigation = useNavigation();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerShadowVisible: false,
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 19,
          letterSpacing: -0.5,
          color: COLORS.text,
        },
        headerLeft: () => (
          <Pressable
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={styles.hamburgerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="menu" size={22} color={COLORS.textSecondary} />
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            onPress={() => router.push('/settings')}
            style={styles.settingsBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="settings-outline" size={19} color={COLORS.textSecondary} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen key="session" name="session" options={{ title: 'Royal Throne' }} />
      <Tabs.Screen key="stats" name="stats" options={{ title: 'Stats' }} />
      <Tabs.Screen key="predict" name="predict" options={{ title: 'Predict' }} />
      <Tabs.Screen key="chat" name="chat" options={{ title: 'Chat' }} />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BOTTOM_INSET = Platform.OS === 'ios' ? 26 : 10;

const styles = StyleSheet.create({
  barOuter: {
    paddingHorizontal: 16,
    paddingBottom: BOTTOM_INSET,
    paddingTop: 8,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    position: 'relative',
  },
  pillContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  pill: {
    flex: 1,
    borderRadius: RADIUS.lg,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.1,
    overflow: 'hidden',
  },
  hamburgerBtn: {
    marginLeft: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  settingsBtn: {
    marginRight: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
});
