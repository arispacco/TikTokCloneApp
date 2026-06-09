import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Grid3X3, LogOut, Play, User as UserIcon } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { postService } from '../services/postService';
import { Post } from '../shared/contracts';
import { logger } from '../utils/logger';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

export default function ProfileScreen(): React.JSX.Element {
  const { user, logout, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserContent = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const userPosts = await postService.getUserPosts(user.uid);
      setPosts(userPosts);
    } catch (error) {
      logger.error('Erreur lors de la recuperation des posts utilisateur', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchUserContent();
  }, [fetchUserContent]);

  const handleLogout = async () => {
    const result = await logout();
    if (!result.success) {
      Alert.alert('Deconnexion impossible', result.error ?? 'Reessaie plus tard.');
    }
  };

  const totalLikes = posts.reduce((acc, post) => acc + (post.likesCount || 0), 0);

  const renderGridItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => logger.debug('Voir le detail du post', item.id)}
    >
      {/* TODO: Utiliser une vraie miniature generee cote serveur ou via react-native-create-thumbnail */}
      <View style={styles.thumbnailPlaceholder}>
        <Play color="rgba(255,255,255,0.6)" size={20} />
      </View>
      <View style={styles.gridItemOverlay}>
        <Play color="#ffffff" size={12} fill="#ffffff" />
        <Text style={styles.gridItemText}>{item.likesCount || 0}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderGridItem}
        keyExtractor={item => item.id}
        numColumns={3}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profil</Text>

            <View style={styles.avatar}>
              <UserIcon color="#ffffff" size={54} strokeWidth={2.2} />
            </View>

            <Text style={styles.username}>
              @{user?.displayName ?? user?.email?.split('@')[0] ?? 'utilisateur'}
            </Text>
            <Text style={styles.email}>{user?.email ?? 'Compte connecte'}</Text>

            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Abonnements</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Abonnes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalLikes}</Text>
                <Text style={styles.statLabel}>J'aime</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              accessibilityRole="button"
              accessibilityLabel="Modifier le profil"
            >
              <Text style={styles.editButtonText}>Modifier le profil</Text>
            </TouchableOpacity>

            <View style={styles.gridHeader}>
              <Grid3X3 color="#ffffff" size={24} strokeWidth={2.4} />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#ff2d55" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Aucune publication</Text>
              <Text style={styles.emptyText}>
                Tes videos publiees apparaitront ici.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              disabled={authLoading}
              accessibilityRole="button"
              accessibilityLabel="Se deconnecter"
            >
              <LogOut color="#ffffff" size={20} strokeWidth={2.3} />
              <Text style={styles.logoutText}>
                {authLoading ? 'Deconnexion...' : 'Se deconnecter'}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    alignItems: 'center',
    paddingTop: 58,
    paddingHorizontal: 24,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  email: { color: '#8f8f8f', fontSize: 14, marginTop: 4 },
  stats: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 30,
  },
  statItem: { alignItems: 'center' },
  statValue: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  statLabel: { color: '#cfcfcf', fontSize: 13, marginTop: 2 },
  editButton: {
    width: 160,
    height: 44,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: 'transparent',
  },
  editButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  gridHeader: {
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
    paddingVertical: 12,
    marginTop: 20,
  },
  gridItem: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH * 1.35,
    padding: 0.5,
    position: 'relative',
  },
  thumbnailPlaceholder: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridItemText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: { 
    paddingTop: 60,
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  emptyTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  emptyText: {
    color: '#8f8f8f',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#242424',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 20,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
});
