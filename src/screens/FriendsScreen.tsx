import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Plus, Search } from 'lucide-react-native';

const friends = [
  { id: 'create', name: 'Creer', initials: 'MO', isCreate: true },
  { id: '1', name: 'falash fx', initials: 'FF' },
  { id: '2', name: 'angy', initials: 'AG' },
  { id: '3', name: 'dila', initials: 'DL' },
];

export default function FriendsScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.title}>Ami(e)s</Text>
        <TouchableOpacity
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Rechercher des amis"
        >
          <Search color="#ffffff" size={34} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={friends}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storyList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.storyItem}
            accessibilityRole="button"
            accessibilityLabel={
              item.isCreate ? 'Creer une story' : `Voir ${item.name}`
            }
          >
            <View style={[styles.avatarRing, item.isCreate && styles.noRing]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.initials}</Text>
              </View>
              {item.isCreate ? (
                <View style={styles.createBadge}>
                  <Plus color="#ffffff" size={22} strokeWidth={3} />
                </View>
              ) : null}
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', paddingTop: 56 },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerSpacer: { width: 44 },
  title: {
    flex: 1,
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyList: { paddingHorizontal: 24, paddingTop: 24 },
  storyItem: { width: 104, alignItems: 'center', marginRight: 18 },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 5,
    borderColor: '#25f4ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noRing: { borderColor: 'transparent' },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#2c2c2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  createBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#12bdf3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    maxWidth: 104,
  },
});
