import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  ViewToken,
  TextInput,
  Share,
  Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Search, X } from 'lucide-react-native';
import { FeedCursor, postService } from '../services/postService';
import { Post } from '../shared/contracts';
import { getErrorMessage, logger } from '../utils/logger';
import VideoPlayer from '../components/VideoPlayer';
import OverlayActions from '../components/OverlayActions';
import CommentSectionModal from '../components/CommentSectionModal';
import { MainTabsParamList } from '../navigation/types';

const { height, width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 66;
const FEED_ITEM_HEIGHT = height - TAB_BAR_HEIGHT;
const FEED_PAGE_SIZE = 15;

// Une vidéo est considérée "active" quand au moins 80% est visible.
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 80 };

export default function FeedScreen(): React.JSX.Element {
  const [videos, setVideos] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isCommentModalVisible, setIsCommentModalVisible] =
    useState<boolean>(false);
  const [selectedPostIdForComment, setSelectedPostIdForComment] = useState<
    string | null
  >(null);
  const [lastFeedCursor, setLastFeedCursor] = useState<FeedCursor | null>(null);
  const [hasMoreFeed, setHasMoreFeed] = useState<boolean>(true);
  const [loadingMoreFeed, setLoadingMoreFeed] = useState<boolean>(false);

  // Nouveaux états pour les fonctionnalités tactiles et interactives
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'pour-toi' | 'suivis'>('pour-toi');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isFocused = useIsFocused();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabsParamList>>();

  const loadFeedData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await postService.getFeedPage(FEED_PAGE_SIZE);
      setVideos(page.posts);
      setLastFeedCursor(page.cursor);
      setHasMoreFeed(page.hasMore);
      setActiveIndex(0);
      setActivePostId(page.posts[0]?.id ?? null);
    } catch (err: unknown) {
      logger.error('Erreur chargement UI Feed :', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeedData();
  }, [loadFeedData]);

  // Récupère le statut du like pour le post actif dès qu'il est visible
  useEffect(() => {
    if (!activePostId) return;
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    if (likedPosts[activePostId] === undefined) {
      const checkLike = async () => {
        try {
          const likeDoc = await firestore()
            .collection('posts')
            .doc(activePostId)
            .collection('likes')
            .doc(userId)
            .get();
          const isLiked = typeof likeDoc.exists === 'function' 
            ? (likeDoc.exists as Function)() 
            : !!likeDoc.exists;
          setLikedPosts(prev => ({ ...prev, [activePostId]: isLiked }));
        } catch (err) {
          logger.error('Erreur verification like :', err);
        }
      };
      checkLike();
    }
  }, [activePostId, likedPosts]);

  const loadMoreFeedData = useCallback(async () => {
    if (loading || loadingMoreFeed || !hasMoreFeed || !lastFeedCursor) {
      return;
    }

    setLoadingMoreFeed(true);
    try {
      const page = await postService.getFeedPage(
        FEED_PAGE_SIZE,
        lastFeedCursor,
      );
      setVideos(prevVideos => {
        const existingIds = new Set(prevVideos.map(video => video.id));
        const nextVideos = page.posts.filter(
          video => !existingIds.has(video.id),
        );
        return [...prevVideos, ...nextVideos];
      });
      setLastFeedCursor(page.cursor);
      setHasMoreFeed(page.hasMore);
    } catch (err: unknown) {
      logger.error('Erreur chargement page suivante du feed :', err);
    } finally {
      setLoadingMoreFeed(false);
    }
  }, [hasMoreFeed, lastFeedCursor, loading, loadingMoreFeed]);

  // Détermine la seule vidéo visible à activer.
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const firstVisible = viewableItems[0];
        const item = firstVisible.item as Post;
        setActivePostId(item.id);
        if (typeof firstVisible.index === 'number') {
          setActiveIndex(firstVisible.index);
        }
      }
    },
  ).current;

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig: VIEWABILITY_CONFIG, onViewableItemsChanged },
  ]).current;

  const handleLike = useCallback(async (postId: string) => {
    const userId = auth().currentUser?.uid;
    if (!userId) {
      logger.warn('Like refusé : utilisateur non connecté.');
      return;
    }

    const isCurrentlyLiked = likedPosts[postId] || false;
    const nextLikedState = !isCurrentlyLiked;

    // Mise à jour optimiste de l'UI
    setLikedPosts(prev => ({ ...prev, [postId]: nextLikedState }));
    setVideos(prevVideos =>
      prevVideos.map(video => {
        if (video.id !== postId) {
          return video;
        }
        const delta = nextLikedState ? 1 : -1;
        return {
          ...video,
          likesCount: Math.max(0, video.likesCount + delta),
        };
      }),
    );

    const result = await postService.toggleLike(postId, userId);
    if (!result.success) {
      // Revenir en arrière en cas d'erreur de transaction
      setLikedPosts(prev => ({ ...prev, [postId]: isCurrentlyLiked }));
      setVideos(prevVideos =>
        prevVideos.map(video => {
          if (video.id !== postId) {
            return video;
          }
          const delta = isCurrentlyLiked ? 1 : -1;
          return {
            ...video,
            likesCount: Math.max(0, video.likesCount + delta),
          };
        }),
      );
    }
  }, [likedPosts]);

  const handleDoubleTapLike = useCallback(async (postId: string) => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    if (likedPosts[postId]) {
      return;
    }

    setLikedPosts(prev => ({ ...prev, [postId]: true }));
    setVideos(prevVideos =>
      prevVideos.map(video => {
        if (video.id !== postId) {
          return video;
        }
        return {
          ...video,
          likesCount: video.likesCount + 1,
        };
      }),
    );

    const result = await postService.toggleLike(postId, userId);
    if (!result.success || !result.liked) {
      setLikedPosts(prev => ({ ...prev, [postId]: false }));
      setVideos(prevVideos =>
        prevVideos.map(video => {
          if (video.id !== postId) {
            return video;
          }
          return {
            ...video,
            likesCount: Math.max(0, video.likesCount - 1),
          };
        }),
      );
    }
  }, [likedPosts]);

  const handleShare = useCallback(async (post: Post) => {
    try {
      await Share.share({
        message: `Regarde cette vidéo TikTokClone :\n"${post.description}"\nRegarder ici : ${post.videoUrl}`,
      });
    } catch (err) {
      logger.error('Erreur partage :', err);
    }
  }, []);

  const handleProfileNavigation = useCallback((creatorId: string) => {
    navigation.navigate('Profile', { userId: creatorId });
  }, [navigation]);

  const handleJoinLive = useCallback(async () => {
    try {
      const snapshot = await firestore().collection('lives').where('status', '==', 'live').limit(1).get();
      if (!snapshot.empty) {
        const liveData = snapshot.docs[0].data();
        (navigation.getParent() as any)?.navigate('LiveViewer', {
          liveId: snapshot.docs[0].id,
          broadcasterName: liveData.broadcasterName
        });
      } else {
        Alert.alert('Aucun Live', "Personne n'est en direct pour le moment.");
      }
    } catch (e) {
      logger.error('Error fetching lives', e);
    }
  }, [navigation]);

  const filteredVideos = React.useMemo(() => {
    let list = videos;
    const currentUserId = auth().currentUser?.uid;

    if (activeTab === 'suivis' && currentUserId) {
      list = list.filter(v => v.userId !== currentUserId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        v =>
          v.description.toLowerCase().includes(q) ||
          (v.title && v.title.toLowerCase().includes(q))
        );
    }
    return list;
  }, [videos, activeTab, searchQuery]);

  const renderVideoItem = useCallback(
    ({ item, index }: { item: Post; index: number }) => {
      const creatorSuffix = item.userId.substring(0, 5);
      const username = `utilisateur_${creatorSuffix}`;

      const shouldRender = Math.abs(index - activeIndex) <= 1;

      return (
        <View style={styles.videoCard}>
          <VideoPlayer
            videoUrl={item.videoUrl}
            isActive={isFocused && item.id === activePostId}
            shouldRender={shouldRender}
            onDoubleTap={() => handleDoubleTapLike(item.id)}
          />

          <View style={styles.topOverlay}>
            {isSearching ? (
              <View style={styles.searchHeader}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher..."
                  placeholderTextColor="#bbbbbb"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={true}
                />
                <TouchableOpacity
                  style={styles.cancelSearchButton}
                  onPress={() => {
                    setIsSearching(false);
                    setSearchQuery('');
                  }}
                >
                  <X color="#ffffff" size={26} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity onPress={handleJoinLive}>
                  <View style={styles.livePill}>
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => setActiveTab('suivis')}>
                  <View style={styles.tabContainer}>
                    <Text style={[styles.topTab, activeTab === 'suivis' && styles.activeTopTab]}>Suivis</Text>
                    {activeTab === 'suivis' && <View style={styles.activeTabIndicator} />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setActiveTab('pour-toi')}>
                  <View style={styles.tabContainer}>
                    <Text style={[styles.topTab, activeTab === 'pour-toi' && styles.activeTopTab]}>Pour toi</Text>
                    {activeTab === 'pour-toi' && <View style={styles.activeTabIndicator} />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={() => setIsSearching(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Rechercher"
                >
                  <Search color="#ffffff" size={33} strokeWidth={2.4} />
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.bottomOverlay}>
            <Text style={styles.username}>@{username}</Text>
            {item.title ? (
              <Text style={styles.postTitle} numberOfLines={1}>
                {item.title}
              </Text>
            ) : null}
            <Text style={styles.description} numberOfLines={2}>
              {item.description || 'Nouvelle publication TikTokClone'}
            </Text>
            <Text style={styles.translationText}>Voir la traduction</Text>
          </View>

          <OverlayActions
            likesCount={item.likesCount}
            commentsCount={item.commentsCount}
            username={username}
            isLiked={!!likedPosts[item.id]}
            onLike={() => handleLike(item.id)}
            onComment={() => {
              setSelectedPostIdForComment(item.id);
              setIsCommentModalVisible(true);
            }}
            onShare={() => handleShare(item)}
            onProfile={() => handleProfileNavigation(item.userId)}
          />
        </View>
      );
    },
    [activeIndex, activePostId, isFocused, handleLike, handleDoubleTapLike, handleShare, handleProfileNavigation, handleJoinLive, isSearching, searchQuery, activeTab, likedPosts],
  );

  const handleCommentAdded = useCallback(() => {
    // Optionnel : Rafraîchir localement le compteur pour éviter un fetch complet.
    if (selectedPostIdForComment) {
      setVideos(prev =>
        prev.map(v =>
          v.id === selectedPostIdForComment
            ? { ...v, commentsCount: v.commentsCount + 1 }
            : v,
        ),
      );
    }
  }, [selectedPostIdForComment]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ff0050" />
        <Text style={styles.loadingText}>Chargement du Feed...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Impossible de charger le feed.</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadFeedData}
          accessibilityRole="button"
          accessibilityLabel="Réessayer le chargement"
        >
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredVideos}
        renderItem={renderVideoItem}
        keyExtractor={item => item.id}
        pagingEnabled={true}
        windowSize={3}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        removeClippedSubviews={true}
        getItemLayout={(_, index) => ({
          length: FEED_ITEM_HEIGHT,
          offset: FEED_ITEM_HEIGHT * index,
          index,
        })}
        snapToInterval={FEED_ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
        onEndReached={loadMoreFeedData}
        onEndReachedThreshold={0.6}
        extraData={activeIndex}
        ListFooterComponent={
          loadingMoreFeed ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#ff0050" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Aucune vidéo pour le moment.</Text>
            <Text style={styles.emptySubtext}>
              Sois le premier à publier un TikTok ! 🎬
            </Text>
          </View>
        }
      />

      {selectedPostIdForComment && (
        <CommentSectionModal
          isVisible={isCommentModalVisible}
          onClose={() => setIsCommentModalVisible(false)}
          postId={selectedPostIdForComment}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  centered: {
    flex: 1,
    height: FEED_ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 24,
  },
  loadingText: { color: 'white', fontSize: 16, marginTop: 12 },
  errorText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  errorSubtext: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#ff0050',
    borderRadius: 25,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  retryText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  emptyText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  emptySubtext: { color: '#aaa', fontSize: 14, marginTop: 8 },
  videoCard: {
    width: width,
    height: FEED_ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  topOverlay: {
    position: 'absolute',
    top: 32,
    left: 0,
    right: 0,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  livePill: {
    minWidth: 48,
    height: 28,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  liveText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  topTab: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 17,
    fontWeight: '800',
    marginRight: 18,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowRadius: 4,
  },
  activeTabWrap: {
    alignItems: 'center',
    marginRight: 'auto',
  },
  activeTopTab: {
    color: '#ffffff',
    marginRight: 0,
  },
  activeTabIndicator: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#ffffff',
    marginTop: 4,
  },
  searchButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 22,
    left: 18,
    width: width * 0.72,
  },
  username: {
    color: 'white',
    fontWeight: '800',
    fontSize: 19,
    marginBottom: 7,
  },
  postTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowRadius: 4,
  },
  description: {
    color: 'white',
    fontSize: 16,
    lineHeight: 21,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowRadius: 4,
  },
  translationText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  loadingMore: {
    height: FEED_ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  tabContainer: {
    alignItems: 'center',
    marginRight: 18,
    position: 'relative',
  },
  searchHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 38,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    padding: 0,
    fontWeight: '600',
  },
  cancelSearchButton: {
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
