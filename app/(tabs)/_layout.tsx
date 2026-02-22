import { TouchableOpacity } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/utils/constants';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconsName;
  iconFocused: IoniconsName;
}

const tabs: TabConfig[] = [
  { name: 'session', title: 'Session', icon: 'timer-outline', iconFocused: 'timer' },
  { name: 'stats', title: 'Stats', icon: 'stats-chart-outline', iconFocused: 'stats-chart' },
  { name: 'predict', title: 'Predict', icon: 'bulb-outline', iconFocused: 'bulb' },
  { name: 'chat', title: 'Chat', icon: 'chatbubbles-outline', iconFocused: 'chatbubbles' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.tabBarActive,
        tabBarInactiveTintColor: COLORS.tabBarInactive,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: COLORS.primaryDark },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={{ marginRight: 16 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ),
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
