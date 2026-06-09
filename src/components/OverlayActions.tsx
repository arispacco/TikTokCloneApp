import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Heart, MessageCircle, Music, Plus, Send } from 'lucide-react-native';

interface OverlayActionsProps {
  likesCount: number;
  commentsCount: number;
  username: string;
  onLike: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onProfile?: () => void;
}

function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace('.', ',')} M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace('.', ',')} K`;
  }
  return String(value);
}

export default function OverlayActions({
  likesCount,
  commentsCount,
  username,
  onLike,
  onComment,
  onShare,
  onProfile,
}: OverlayActionsProps): React.JSX.Element {
  return (
    <View style={styles.rightSidebar}>
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={onProfile}
        accessibilityRole="button"
        accessibilityLabel={`Ouvrir le profil de ${username}`}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>
            {username.substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.followBadge}>
          <Plus color="#ffffff" size={18} strokeWidth={3} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={onLike}
        accessibilityRole="button"
        accessibilityLabel={`Aimer la vidéo, ${likesCount} j'aime`}
      >
        <Heart
          color="#ffffff"
          fill="#ffffff"
          size={38}
          strokeWidth={2.4}
          style={styles.actionIcon}
        />
        <Text style={styles.actionLabel}>{formatCount(likesCount)}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={onComment}
        accessibilityRole="button"
        accessibilityLabel="Voir les commentaires"
      >
        <MessageCircle
          color="#ffffff"
          fill="#ffffff"
          size={36}
          strokeWidth={2.4}
          style={styles.actionIcon}
        />
        <Text style={styles.actionLabel}>{formatCount(commentsCount)}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={onShare}
        accessibilityRole="button"
        accessibilityLabel="Partager la vidéo"
      >
        <Send
          color="#ffffff"
          fill="#ffffff"
          size={35}
          strokeWidth={2.2}
          style={styles.actionIcon}
        />
        <Text style={styles.actionLabel}>Partager</Text>
      </TouchableOpacity>

      <View style={styles.musicDisc}>
        <Music color="#ffffff" size={20} strokeWidth={2.4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rightSidebar: {
    position: 'absolute',
    bottom: 24,
    right: 14,
    alignItems: 'center',
  },
  avatarButton: {
    width: 58,
    height: 68,
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { color: '#ffffff', fontSize: 17, fontWeight: '900' },
  followBadge: {
    position: 'absolute',
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ff2d55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: { alignItems: 'center', marginBottom: 18, width: 64 },
  actionIcon: { marginBottom: 5 },
  actionLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  musicDisc: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111111',
    borderWidth: 8,
    borderColor: '#2b2b2b',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
