import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { getChannel, removeChannel } from '@/lib/realtime';
import { getProfile } from '@/lib/database';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SPACING, SHADOWS } from '@/utils/constants';

export default function RoomChatScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const user = useAuthStore((s) => s.user);
  const {
    rooms,
    roomMessages,
    roomErrors,
    loadRoomMessages,
    addRoomMessage,
    sendRoomMessage,
    joinRoom,
    leaveRoom,
  } = useChatStore();

  const flatListRef = useRef<FlatList>(null);
  const room = rooms.find((r) => r.id === roomId);
  const messages = roomMessages[roomId ?? ''] ?? [];
  const [myProfile, setMyProfile] = useState({ display_name: 'Anonymous Pooper', avatar_emoji: '💩' });
  const [senderProfiles, setSenderProfiles] = useState<Record<string, { name: string; emoji: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const error = roomErrors?.[roomId ?? ''] ?? null;

  useEffect(() => {
    if (user?.id) {
      getProfile(user.id).then((p) => {
        if (p) setMyProfile({ display_name: p.display_name, avatar_emoji: p.avatar_emoji });
      });
    }
  }, [user?.id]);

  useEffect(() => {
    if (!roomId || !user?.id) return;

    joinRoom(roomId, user.id);
    setIsLoading(true);
    loadRoomMessages(roomId).finally(() => setIsLoading(false));

    const channel = getChannel(`room:${roomId}`);
    channel
      .on('broadcast', { event: 'message' }, (payload) => {
        if (payload.payload) {
          const msg = payload.payload as any;
          if (msg.senderName && msg.sender_id) {
            setSenderProfiles((prev) => ({
              ...prev,
              [msg.sender_id]: { name: msg.senderName, emoji: msg.senderEmoji || '💩' },
            }));
          }
          addRoomMessage(roomId, msg);
        }
      })
      .subscribe();

    return () => {
      if (user?.id) {
        leaveRoom(roomId, user.id);
      }
      removeChannel(`room:${roomId}`);
    };
  }, [roomId, user?.id]);

  const handleRetry = async () => {
    if (!roomId) return;
    setIsLoading(true);
    await loadRoomMessages(roomId);
    setIsLoading(false);
  };

  const handleSend = async (content: string) => {
    if (!user?.id || !roomId) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sendRoomMessage(user.id, roomId, content);

      const channel = getChannel(`room:${roomId}`);
      channel.send({
        type: 'broadcast',
        event: 'message',
        payload: {
          id: `temp-${Date.now()}`,
          room_id: roomId,
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen
        options={{
          title: room?.name ?? 'Chat Room',
          headerStyle: { backgroundColor: COLORS.background },
          headerShadowVisible: false,
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '800', fontSize: 17, color: COLORS.text },
        }}
      />

      {isLoading ? (
        <Animated.View entering={FadeIn.duration(300)} style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </Animated.View>
      ) : error ? (
        <Animated.View entering={FadeIn.duration(300)} style={styles.centered}>
          <Text style={styles.errorOrb}>😿</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const profile = senderProfiles[item.sender_id];
            return (
              <MessageBubble
                content={item.content}
                senderName={
                  item.sender_id === user?.id
                    ? myProfile.display_name
                    : profile?.name ?? 'Anonymous Pooper'
                }
                senderEmoji={
                  item.sender_id === user?.id
                    ? myProfile.avatar_emoji
                    : profile?.emoji ?? '💩'
                }
                isOwn={item.sender_id === user?.id}
                createdAt={item.created_at}
              />
            );
          }}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>No messages yet. Say hello!</Text>
            </View>
          }
        />
      )}

      <ChatInput onSend={handleSend} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  messageList: {
    padding: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['2xl'],
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  errorOrb: {
    fontSize: 48,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
    marginTop: SPACING.xs,
  },
  retryText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyChat: {
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
  },
  emptyChatText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
});
