import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Heart, Inbox, Plus, Search, Users } from 'lucide-react-native';

const conversations = [
  {
    id: 'followers',
    title: 'Nouveaux followers',
    preview: "bertrand l'amour a commence a te suivre",
    badge: '99+',
    type: 'followers',
  },
  {
    id: 'activity',
    title: 'Activite',
    preview: 'Mama Rita Shop a repondu a ton commentaire',
    badge: '99+',
    type: 'activity',
  },
  {
    id: 'system',
    title: 'Notifications systeme',
    preview: 'Mises a jour du compte et securite',
    date: '5 mars',
    unread: true,
    type: 'system',
  },
  {
    id: 'direct',
    title: 'Devient millionnaire',
    preview: 'ouverture de la discussion',
    date: '30 janv.',
    type: 'direct',
  },
];

function ConversationIcon({ type }: { type: string }): React.JSX.Element {
  if (type === 'followers') {
    return (
      <View style={[styles.conversationIcon, styles.followersIcon]}>
        <Users color="#ffffff" size={36} fill="#ffffff" />
      </View>
    );
  }

  if (type === 'activity') {
    return (
      <View style={[styles.conversationIcon, styles.activityIcon]}>
        <Heart color="#ffffff" size={38} fill="#ffffff" />
      </View>
    );
  }

  return (
    <View style={[styles.conversationIcon, styles.systemIcon]}>
      <Inbox color="#ffffff" size={34} strokeWidth={2.6} />
    </View>
  );
}

export default function MessagesScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Creer un groupe"
        >
          <Users color="#000000" size={34} strokeWidth={2.7} />
          <Plus
            color="#000000"
            size={16}
            strokeWidth={3}
            style={styles.groupPlus}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Messages</Text>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Rechercher dans les messages"
        >
          <Search color="#000000" size={38} strokeWidth={2.1} />
        </TouchableOpacity>
      </View>

      <View style={styles.tooltip}>
        <Text style={styles.tooltipText}>Lance un groupe ici</Text>
      </View>

      <View style={styles.createRow}>
        <View style={styles.createAvatar}>
          <Text style={styles.createAvatarText}>MO</Text>
          <View style={styles.createBadge}>
            <Plus color="#ffffff" size={22} strokeWidth={3} />
          </View>
        </View>
        <Text style={styles.createText}>Creer</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.messageRow}
            accessibilityRole="button"
            accessibilityLabel={`Ouvrir ${item.title}`}
          >
            <ConversationIcon type={item.type} />
            <View style={styles.messageBody}>
              <Text style={styles.messageTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.preview} numberOfLines={1}>
                {item.preview}
                {item.date ? <Text style={styles.date}> · {item.date}</Text> : null}
              </Text>
            </View>
            {item.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : null}
            {item.unread ? <View style={styles.unreadDot} /> : null}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingTop: 56 },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  headerButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupPlus: { position: 'absolute', right: 0, bottom: 4 },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  title: { color: '#000000', fontSize: 30, fontWeight: '800' },
  statusPill: {
    width: 38,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#eeeeee',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#20d36b',
  },
  tooltip: {
    alignSelf: 'flex-start',
    backgroundColor: '#3a3a3c',
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 16,
    marginLeft: 0,
    marginTop: 8,
  },
  tooltipText: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
  createRow: { width: 132, alignItems: 'center', marginTop: 10, marginLeft: 30 },
  createAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#d5d5d5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createAvatarText: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
  createBadge: {
    position: 'absolute',
    right: -2,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#16bff2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  list: { paddingTop: 56, paddingHorizontal: 32 },
  messageRow: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  conversationIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  followersIcon: { backgroundColor: '#16bff2' },
  activityIcon: { backgroundColor: '#ff2d55' },
  systemIcon: { backgroundColor: '#070b2b' },
  messageBody: { flex: 1, minWidth: 0 },
  messageTitle: { color: '#000000', fontSize: 24, fontWeight: '800' },
  preview: { color: '#000000', fontSize: 22, marginTop: 6 },
  date: { color: '#8c8c8c' },
  badge: {
    backgroundColor: '#ff2d55',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginLeft: 12,
  },
  badgeText: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  unreadDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ff2d55',
    marginLeft: 14,
  },
});
