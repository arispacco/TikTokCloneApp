import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { ArrowLeft, Grid3X3, LogOut, Play, User as UserIcon } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import firestore from '@react-native-firebase/firestore';
import { postService } from '../services/postService';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import { Post, User } from '../shared/contracts';
import { logger } from '../utils/logger';
import { MainTabsParamList } from '../navigation/types';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

export default function ProfileScreen(): React.JSX.Element {
  const { user, profile, logout, loading: authLoading } = useAuth();
  const route = useRoute<RouteProp<MainTabsParamList, 'Profile'>>();
  const navigation = useNavigation();

  const targetUserId = route.params?.userId || user?.uid;
  const isOwnProfile = !route.params?.userId || route.params?.userId === user?.uid;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileData, setProfileData] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  const fetchProfileAndContent = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);
    setProfileLoading(true);
    try {
      // 1. Charger les posts de l'utilisateur
      const userPosts = await postService.getUserPosts(targetUserId);
      setPosts(userPosts);

      // 2. Charger le profil de l'utilisateur
      if (isOwnProfile) {
        setProfileData(profile);
      } else {
        const fetchedProfile = await authService.getUserProfile(targetUserId);
        setProfileData(fetchedProfile);
      }
    } catch (error) {
      logger.error(
        'Erreur lors de la recuperation des posts/profil utilisateur',
        error,
      );
    } finally {
      setLoading(false);
      setProfileLoading(false);
    }
  }, [targetUserId, isOwnProfile, profile]);

  useEffect(() => {
    fetchProfileAndContent();
  }, [fetchProfileAndContent]);

  const handleLogout = async () => {
    const result = await logout();
    if (!result.success) {
      Alert.alert(
        'Deconnexion impossible',
        result.error ?? 'Reessaie plus tard.',
      );
    }
  };

  const handleFollowToggle = () => {
    setIsFollowing(prev => {
      const nextState = !prev;
      if (profileData) {
        setProfileData({
          ...profileData,
          followersCount: profileData.followersCount + (nextState ? 1 : -1),
        });
      }
      return nextState;
    });
  };

  const handleEditAvatar = async () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      async response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Erreur', "Impossible de charger l'image.");
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const uri = response.assets[0].uri;
          if (!uri || !user?.uid) return;

          setProfileLoading(true);
          try {
            const downloadUrl = await storageService.uploadAvatar(user.uid, uri);
            if (downloadUrl) {
              await firestore().collection('users').doc(user.uid).update({
                avatarUrl: downloadUrl,
              });
              setProfileData(prev => prev ? { ...prev, avatarUrl: downloadUrl } : null);
              Alert.alert('Succès', 'Photo de profil mise à jour !');
            } else {
              Alert.alert('Erreur', "Le téléversement de l'image a échoué.");
            }
          } catch (err) {
            logger.error('Erreur édition avatar :', err);
            Alert.alert('Erreur', 'Une erreur est survenue lors de la mise à jour.');
          } finally {
            setProfileLoading(false);
          }
        }
      }
    );
  };

  const totalLikes = posts.reduce(
    (acc, post) => acc + (post.likesCount || 0),
    0,
  );

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
            <View style={styles.headerTopBar}>
              {!isOwnProfile && (
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                  accessibilityRole="button"
                  accessibilityLabel="Retour"
                >
                  <ArrowLeft color="#ffffff" size={28} />
                </TouchableOpacity>
              )}
              <Text style={styles.headerTitle}>Profil</Text>
            </View>

            <TouchableOpacity
              onPress={isOwnProfile ? handleEditAvatar : undefined}
              activeOpacity={isOwnProfile ? 0.8 : 1}
              accessibilityRole="button"
              accessibilityLabel="Changer la photo de profil"
            >
              <View style={styles.avatar}>
                {profileData?.avatarUrl && profileData.avatarUrl !== 'https://placeholder.com/avatar.png' ? (
                  <Image source={{ uri: profileData.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <UserIcon color="#ffffff" size={54} strokeWidth={2.2} />
                )}
                {isOwnProfile && (
                  <View style={styles.avatarEditBadge}>
                    <Text style={styles.avatarEditBadgeText}>+</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {profileLoading ? (
              <ActivityIndicator color="#ff2d55" style={styles.loadingIndicatorTop} />
            ) : (
              <>
                <Text style={styles.username}>
                  @
                  {profileData?.username ?? 'utilisateur'}
                </Text>
                <Text style={styles.email}>
                  {profileData?.email ?? (isOwnProfile ? user?.email : 'Compte connecté')}
                </Text>

                <View style={styles.stats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {profileData?.followingCount ?? 0}
                    </Text>
                    <Text style={styles.statLabel}>Abonnements</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {profileData?.followersCount ?? 0}
                    </Text>
                    <Text style={styles.statLabel}>Abonnes</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{totalLikes}</Text>
                    <Text style={styles.statLabel}>J'aime</Text>
                  </View>
                </View>

                {!isOwnProfile ? (
                  <TouchableOpacity
                    style={[styles.followButton, isFollowing && styles.followingButton]}
                    onPress={handleFollowToggle}
                    accessibilityRole="button"
                    accessibilityLabel={isFollowing ? 'Se désabonner' : "S'abonner"}
                  >
                    <Text style={styles.followButtonText}>
                      {isFollowing ? 'Abonné' : "S'abonner"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleEditAvatar}
                    accessibilityRole="button"
                    accessibilityLabel="Modifier le profil"
                  >
                    <Text style={styles.editButtonText}>Modifier le profil</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            <View style={styles.gridHeader}>
              <Grid3X3 color="#ffffff" size={24} strokeWidth={2.4} />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              size="large"
              color="#ff2d55"
              style={styles.loadingIndicator}
            />
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
          isOwnProfile ? (
            <View style={styles.footer}>
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
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingIndicatorTop: {
    marginTop: 20,
  },
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
    justifyContent: 'center',
  },
  emptyTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  emptyText: {
    color: '#8f8f8f',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  loadingIndicator: {
    marginTop: 40,
  },
  footer: {
    paddingVertical: 40,
    alignItems: 'center',
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
  headerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    marginBottom: 20,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  followButton: {
    width: 160,
    height: 44,
    borderRadius: 4,
    backgroundColor: '#ff2d55',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  followingButton: {
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff2d55',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  avatarEditBadgeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginTop: -2,
  },
});
