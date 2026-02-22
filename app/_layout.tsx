import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import {
  showSessionNotification,
  dismissSessionNotification,
  scheduleEngagementNotifications,
} from '@/lib/notifications';
import { COLORS } from '@/utils/constants';

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const isActive = useSessionStore((s) => s.isActive);
  const startTime = useSessionStore((s) => s.startTime);
  const appState = useRef(AppState.currentState);

  // Auth init
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Schedule engagement notifications (lazy — only loads module when needed)
  useEffect(() => {
    // Delay to avoid loading notification module during initial render
    const timer = setTimeout(() => {
      scheduleEngagementNotifications();
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Session notification: show when app backgrounds during active session
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        nextState.match(/inactive|background/) &&
        appState.current === 'active' &&
        isActive &&
        startTime
      ) {
        showSessionNotification(startTime);
      } else if (
        nextState === 'active' &&
        appState.current.match(/inactive|background/)
      ) {
        dismissSessionNotification();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [isActive, startTime]);

  // Dismiss session notification when session ends
  useEffect(() => {
    if (!isActive) {
      dismissSessionNotification();
    }
  }, [isActive]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.primaryDark },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="chat/[roomId]"
          options={{ title: 'Chat Room', presentation: 'card' }}
        />
        <Stack.Screen
          name="chat/buddy/[matchId]"
          options={{ title: 'Poop Buddy', presentation: 'card' }}
        />
        <Stack.Screen
          name="settings"
          options={{ title: 'Settings', presentation: 'card' }}
        />
      </Stack>
    </>
  );
}
