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
import { Heart, MessageCircle } from 'lucide-react-native';
import { postService } from '../services/postService';
import { Post } from '../shared/contracts';
import { getErrorMessage, logger } from '../utils/logger';
import VideoPlayer from '../components/VideoPlayer';

const { height, width } = Dimensions.get('window');

// Une vidéo est considérée "active" quand au moins 80% est visible.
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 80 };

export default function FeedScreen(): React.JSX.Element {
  const [videos, setVideos] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);

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
      return (
        <View style={styles.videoCard}>
          <VideoPlayer
            videoUrl={item.videoUrl}
            isActive={isFocused && item.id === activePostId}
          />

          <View style={styles.bottomOverlay}>
            <Text style={styles.username}>
              @utilisateur_{item.userId.substring(0, 5)}
            </Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>

          <View style={styles.rightSidebar}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLike(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Aimer la vidéo, ${item.likesCount} j'aime`}
            >
              <Heart
                color="#ffffff"
                fill="#ffffff"
                size={38}
                strokeWidth={2.4}
                style={styles.actionIcon}
              />
              <Text style={styles.actionLabel}>{item.likesCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => logger.debug('Ouvrir les commentaires')}
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
              <Text style={styles.actionLabel}>{item.commentsCount}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [activePostId, isFocused, handleLike],
  );

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
        snapToInterval={height}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  centered: {
    flex: 1,
    height,
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
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 15,
    width: width * 0.75,
  },
  username: { color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  description: { color: 'white', fontSize: 14 },
  rightSidebar: {
    position: 'absolute',
    bottom: 120,
    right: 15,
    alignItems: 'center',
  },
  actionButton: { alignItems: 'center', marginBottom: 20 },
  actionIcon: { marginBottom: 5 },
  actionLabel: { color: 'white', fontSize: 12, fontWeight: 'bold' },
});
