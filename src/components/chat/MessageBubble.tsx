import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '@/utils/constants';
import { formatTime } from '@/utils/formatters';

interface Props {
  content: string;
  senderName: string;
  senderEmoji: string;
  isOwn: boolean;
  createdAt: string;
}

export function MessageBubble({ content, senderName, senderEmoji, isOwn, createdAt }: Props) {
  return (
    <View style={[styles.container, isOwn ? styles.containerOwn : styles.containerOther]}>
      {/* Sender avatar (other only) */}
      {!isOwn && (
        <View style={styles.avatarCol}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{senderEmoji}</Text>
          </View>
        </View>
      )}

      <View style={[styles.messageCol, isOwn && styles.messageColOwn]}>
        {/* Sender name (other only) */}
        {!isOwn && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}

        {/* Bubble */}
        <View style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
        ]}>
          <Text style={[styles.bubbleText, isOwn ? styles.textOwn : styles.textOther]}>
            {content}
          </Text>
        </View>

        {/* Timestamp */}
        <Text style={[styles.time, isOwn && styles.timeOwn]}>
          {formatTime(createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 5,
    maxWidth: '82%',
  },
  containerOwn: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  containerOther: {
    alignSelf: 'flex-start',
  },
  avatarCol: {
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  avatarEmoji: {
    fontSize: 14,
  },
  messageCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  messageColOwn: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 3,
    marginLeft: 4,
    letterSpacing: 0.2,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    maxWidth: '100%',
  },
  bubbleOwn: {
    backgroundColor: COLORS.chatBubbleSelf,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  bubbleOther: {
    backgroundColor: COLORS.chatBubbleOther,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  textOwn: {
    color: '#F0F6FF',
  },
  textOther: {
    color: COLORS.text,
  },
  time: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 3,
    marginLeft: 4,
    fontWeight: '500',
  },
  timeOwn: {
    marginLeft: 0,
    marginRight: 4,
  },
});
