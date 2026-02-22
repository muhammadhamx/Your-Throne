import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENGAGEMENT_NOTIFICATIONS, getRandomItem } from '@/humor/jokes';

const NOTIFICATIONS_ENABLED_KEY = '@notifications_enabled';
const SESSION_NOTIFICATION_ID = 'active-session';

let _module: any = null;
let _initialized = false;

// Only load the module when we actually need it (avoids Expo Go console error on startup)
function getNotifications() {
  if (!_module) {
    _module = require('expo-notifications');
  }
  return _module as typeof import('expo-notifications');
}

async function ensureInitialized() {
  if (_initialized || Platform.OS === 'web') return;
  _initialized = true;

  const Notifications = getNotifications();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('session', {
      name: 'Active Session',
      description: 'Shows when a poop session is in progress',
      importance: Notifications.AndroidImportance.LOW,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: undefined,
      enableVibrate: false,
    });
    await Notifications.setNotificationChannelAsync('engagement', {
      name: 'Tips & Fun',
      description: 'Funny tips, health advice, and poop facts',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    await ensureInitialized();
    const Notifications = getNotifications();
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function isNotificationsEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  return val !== 'false';
}

// ============ SESSION NOTIFICATION (timer in status bar) ============

export async function showSessionNotification(startTime: number) {
  if (Platform.OS === 'web') return;

  try {
    await ensureInitialized();
    const Notifications = getNotifications();

    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    const funMessages = [
      'Still going strong!',
      'The throne awaits your return.',
      'Your royal session continues.',
      'Tap to check your timer.',
    ];

    await Notifications.scheduleNotificationAsync({
      identifier: SESSION_NOTIFICATION_ID,
      content: {
        title: '🚽 Session Active — ' + timeStr,
        body: getRandomItem(funMessages),
        sticky: Platform.OS === 'android',
        autoDismiss: false,
        ...(Platform.OS === 'android' && { channelId: 'session' }),
      },
      trigger: null,
    });
  } catch {
    // Gracefully fail
  }
}

export async function dismissSessionNotification() {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = getNotifications();
    await Notifications.dismissNotificationAsync(SESSION_NOTIFICATION_ID);
    await Notifications.cancelScheduledNotificationAsync(SESSION_NOTIFICATION_ID);
  } catch {
    // Notification may not exist
  }
}

// ============ ENGAGEMENT NOTIFICATIONS ============

export async function scheduleEngagementNotifications() {
  if (Platform.OS === 'web') return;

  try {
    const enabled = await isNotificationsEnabled();
    if (!enabled) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    await cancelEngagementNotifications();

    const Notifications = getNotifications();

    const windows = [
      { minHour: 7, maxHour: 9 },
      { minHour: 12, maxHour: 14 },
      { minHour: 19, maxHour: 21 },
    ];

    const shuffled = [...ENGAGEMENT_NOTIFICATIONS].sort(() => Math.random() - 0.5);

    for (let i = 0; i < windows.length; i++) {
      const w = windows[i];
      const hour = w.minHour + Math.floor(Math.random() * (w.maxHour - w.minHour));
      const minute = Math.floor(Math.random() * 60);
      const msg = shuffled[i % shuffled.length];

      await Notifications.scheduleNotificationAsync({
        identifier: `engagement-${i}`,
        content: {
          title: msg.title,
          body: msg.body,
          ...(Platform.OS === 'android' && { channelId: 'engagement' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    }
  } catch {
    // Gracefully fail
  }
}

export async function cancelEngagementNotifications() {
  if (Platform.OS === 'web') return;
  for (let i = 0; i < 3; i++) {
    try {
      const Notifications = getNotifications();
      await Notifications.cancelScheduledNotificationAsync(`engagement-${i}`);
    } catch {
      // Ignore
    }
  }
}
