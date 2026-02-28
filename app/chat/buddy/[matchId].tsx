import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { getChannel, removeChannel } from '@/lib/realtime';
import { getProfile } from '@/lib/database';
import { getRandomItem, BUDDY_ICEBREAKERS } from '@/humor/jokes';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SPACING, SHADOWS } from '@/utils/constants';

export default function BuddyChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const user = useAuthStore((s) => s.user);
  const {
    buddyMessages,
    loadBuddyMessages,
    addBuddyMessage,
    sendBuddyMessage,
    endMatch,
  } = useChatStore();

  const flatListRef = useRef<FlatList>(null);
  const [icebreaker] = useState(() => getRandomItem(BUDDY_ICEBREAKERS));
  const [myProfile, setMyProfile] = useState({ display_name: 'You', avatar_emoji: '💩' });
  const [buddyProfile, setBuddyProfile] = useState({ name: 'Poop Buddy', emoji: '💩' });

  useEffect(() => {
    if (user?.id) {
      getProfile(user.id).then((p) => {
        if (p) setMyProfile({ display_name: p.display_name, avatar_emoji: p.avatar_emoji });
      });
    }
  }, [user?.id]);

  useEffect(() => {
    if (!matchId) return;

    loadBuddyMessages(matchId);

    const channel = getChannel(`buddy:${matchId}`);
    channel
      .on('broadcast', { event: 'message' }, (payload) => {
        if (payload.payload) {
          const msg = payload.payload as any;
          if (msg.senderName && msg.sender_id !== user?.id) {
            setBuddyProfile({ name: msg.senderName, emoji: msg.senderEmoji || '💩' });
          }
          addBuddyMessage(msg);
        }
      })
      .on('broadcast', { event: 'end' }, () => {
        useChatStore.getState().clearMatch();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Chat Ended', 'Your poop buddy left. Until next time!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      })
      .subscribe();

    return () => {
      removeChannel(`buddy:${matchId}`);
    };
  }, [matchId]);

  const handleSend = async (content: string) => {
    if (!user?.id || !matchId) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sendBuddyMessage(user.id, matchId, content);

      const channel = getChannel(`buddy:${matchId}`);
      channel.send({
        type: 'broadcast',
        event: 'message',
        payload: {
          id: `temp-${Date.now()}`,
          match_id: matchId,
          sender_id: user.id,
          content,
          created_at: new Date().toISOString(),
          senderName: myProfile.display_name,
          senderEmoji: myProfile.avatar_emoji,
        },
      });
    } catch {
      // Error already set in store
    }
  };

  const handleEnd = () => {
    Alert.alert('End Chat?', 'Your poop buddy will be notified.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Chat',
        style: 'destructive',
        onPress: async () => {
          if (!matchId || !user?.id) return;
          const channel = getChannel(`buddy:${matchId}`);
          await channel.send({ type: 'broadcast', event: 'end', payload: {} });
          await new Promise((r) => setTimeout(r, 300));
          await endMatch(matchId, user.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen
        options={{
          title: buddyProfile.name !== 'Poop Buddy' ? buddyProfile.name : 'Poop Buddy',
          headerStyle: { backgroundColor: COLORS.background },
          headerShadowVisible: false,
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '800', fontSize: 17, color: COLORS.text },
          headerRight: () => (
            <Pressable
              onPress={handleEnd}
              style={styles.endBtn}
            >
              <Text style={styles.endBtnText}>End</Text>
            </Pressable>
          ),
        }}
      />

      {/* Icebreaker card */}
      {buddyMessages.length === 0 && (
        <Animated.View entering={FadeInDown.delay(100).duration(400).springify()} style={styles.icebreakerCard}>
          <View style={styles.icebreakerIcon}>
            <Text style={styles.icebreakerEmoji}>💡</Text>
          </View>
          <Text style={styles.icebreakerText}>
            "{icebreaker}"
          </Text>
        </Animated.View>
      )}

      <FlatList
        ref={flatListRef}
        data={buddyMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            content={item.content}
            senderName={item.sender_id === user?.id ? myProfile.display_name : buddyProfile.name}
            senderEmoji={item.sender_id === user?.id ? myProfile.avatar_emoji : buddyProfile.emoji}
            isOwn={item.sender_id === user?.id}
            createdAt={item.created_at}
          />
        )}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>Break the ice! Say something...</Text>
          </View>
        }
      />

      <ChatInput onSend={handleSend} placeholder="Say something..." />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  endBtn: {
    marginRight: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    backgroundColor: COLORS.errorBg,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.error + '35',
  },
  endBtnText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '700',
  },
  icebreakerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceRaised,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  icebreakerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icebreakerEmoji: {
    fontSize: 15,
  },
  icebreakerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  messageList: {
    padding: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  emptyChat: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
  },
  emptyChatText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
});
