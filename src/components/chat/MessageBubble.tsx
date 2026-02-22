import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/utils/constants';
import { formatTime } from '@/utils/formatters';

interface Props {
  content: string;
  senderName: string;
  senderEmoji: string;
  isOwn: boolean;
  createdAt: string;
}

export function MessageBubble({
  content,
  senderName,
  senderEmoji,
  isOwn,
  createdAt,
}: Props) {
  return (
    <View
      style={[
        styles.container,
        isOwn ? styles.containerOwn : styles.containerOther,
      ]}
    >
      {!isOwn && (
        <View style={styles.senderRow}>
          <Text style={styles.senderEmoji}>{senderEmoji}</Text>
          <Text style={styles.senderName}>{senderName}</Text>
        </View>
      )}
      <View
        style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}
      >
        <Text
          style={[styles.text, isOwn ? styles.textOwn : styles.textOther]}
        >
          {content}
        </Text>
      </View>
      <Text
        style={[styles.time, isOwn ? styles.timeOwn : styles.timeOther]}
      >
        {formatTime(createdAt)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  containerOwn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  containerOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  senderEmoji: {
    fontSize: 12,
  },
  senderName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleOwn: {
    backgroundColor: COLORS.chatBubbleSelf,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: COLORS.chatBubbleOther,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  textOwn: {
    color: '#FFFFFF',
  },
  textOther: {
    color: COLORS.text,
  },
  time: {
    fontSize: 10,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  timeOwn: {
    color: COLORS.textLight,
  },
  timeOther: {
    color: COLORS.textLight,
  },
});
