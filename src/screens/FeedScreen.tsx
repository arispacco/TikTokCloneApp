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
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { useIsFocused } from '@react-navigation/native';
import { Search } from 'lucide-react-native';
import { postService } from '../services/postService';
import { Post } from '../shared/contracts';
import { getErrorMessage, logger } from '../utils/logger';
import VideoPlayer from '../components/VideoPlayer';
import OverlayActions from '../components/OverlayActions';
import CommentSectionModal from '../components/CommentSectionModal';

const { height, width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 66;
const FEED_ITEM_HEIGHT = height - TAB_BAR_HEIGHT;

// Une vidéo est considérée "active" quand au moins 80% est visible.
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 80 };

export default function FeedScreen(): React.JSX.Element {
  const [videos, setVideos] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState<boolean>(false);
  const [selectedPostIdForComment, setSelectedPostIdForComment] = useState<string | null>(null);

  const isFocused = useIsFocused();

  const loadFeedData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const feedItems = await postService.getFeed();
      setVideos(feedItems);
      setActivePostId(prev => prev ?? feedItems[0]?.id ?? null);
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

  // Détermine la seule vidéo visible à activer.
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const firstVisible = viewableItems[0].item as Post;
        setActivePostId(firstVisible.id);
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

    const result = await postService.toggleLike(postId, userId);
    if (!result.success) {
      return;
    }

    // Ajuste le compteur de +1 / -1 selon l'état réel renvoyé par le service.
    setVideos(prevVideos =>
      prevVideos.map(video => {
        if (video.id !== postId) {
          return video;
        }
        const delta = result.liked ? 1 : -1;
        return {
          ...video,
          likesCount: Math.max(0, video.likesCount + delta),
        };
      }),
    );
  }, []);

  const renderVideoItem = useCallback(
    ({ item }: { item: Post }) => {
      const creatorSuffix = item.userId.substring(0, 5);
      const username = `utilisateur_${creatorSuffix}`;

      return (
        <View style={styles.videoCard}>
          <VideoPlayer
            videoUrl={item.videoUrl}
            isActive={isFocused && item.id === activePostId}
          />

          <View style={styles.topOverlay}>
            <View style={styles.livePill}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.topTab}>Communauté</Text>
            <Text style={styles.topTab}>Suivis</Text>
            <View style={styles.activeTabWrap}>
              <Text style={[styles.topTab, styles.activeTopTab]}>Pour toi</Text>
              <View style={styles.activeTabIndicator} />
            </View>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => logger.debug('Ouvrir la recherche')}
              accessibilityRole="button"
              accessibilityLabel="Rechercher"
            >
              <Search color="#ffffff" size={33} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomOverlay}>
            <Text style={styles.username}>@{username}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {item.description || 'Nouvelle publication TikTokClone'}
            </Text>
            <Text style={styles.translationText}>Voir la traduction</Text>
          </View>

          <OverlayActions
            likesCount={item.likesCount}
            commentsCount={item.commentsCount}
            username={username}
            onLike={() => handleLike(item.id)}
            onComment={() => {
              setSelectedPostIdForComment(item.id);
              setIsCommentModalVisible(true);
            }}
            onShare={() => logger.debug('Partager la vidéo')}
            onProfile={() => logger.debug('Ouvrir le profil createur')}
          />
        </View>
      );
    },
    [activePostId, isFocused, handleLike],
  );

  const handleCommentAdded = useCallback(() => {
    // Optionnel : Rafraîchir localement le compteur pour éviter un fetch complet.
    if (selectedPostIdForComment) {
      setVideos(prev => 
        prev.map(v => 
          v.id === selectedPostIdForComment 
            ? { ...v, commentsCount: v.commentsCount + 1 } 
            : v
        )
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
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={item => item.id}
        pagingEnabled={true}
        windowSize={3}
        snapToInterval={FEED_ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
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
  username: { color: 'white', fontWeight: '800', fontSize: 19, marginBottom: 7 },
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
});
