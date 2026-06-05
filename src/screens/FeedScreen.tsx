import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { postService, Post } from '../services/postService';
import VideoPlayer from '../components/VideoPlayer';

// Récupère les dimensions exactes de l'écran du téléphone pour le mode plein écran
const { height, width } = Dimensions.get('window');

export default function FeedScreen() {
  const [videos, setVideos] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. CHARGEMENT DES DONNÉES
  useEffect(() => {
    loadFeedData();
  }, []);

  const loadFeedData = async () => {
    try {
      const feedItems = await postService.getFeed();
      setVideos(feedItems);
    } catch (error) {
      console.error("Erreur chargement UI Feed :", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. LOGIQUE DES BOUTONS INTERACTIFS
  const handleLike = async (postId: string) => {
    const fakeUserId = "current_user_123"; // ID temporaire en attendant le hook d'auth global
    const result = await postService.toggleLike(postId, fakeUserId);
    
    if (result.success) {
      // Met à jour l'affichage du compteur de likes instantanément sur l'écran
      setVideos(prevVideos => 
        prevVideos.map(video => {
          if (video.id === postId) {
            return { ...video, likesCount: video.likesCount + 1 }; // Mode simplifié pour le visuel
          }
          return video;
        })
      );
    }
  };

  // 3. RENDU D'UNE VIDÉO UNIQUE (L'ÉLÉMENT DE LA LISTE)
  const renderVideoItem = ({ item, index }: { item: Post; index: number }) => {
    return (
      <View style={styles.videoCard}>
        
        {/* 🎥 LE VRAI MOTEUR VIDÉO INTÉGRÉ */}
        <VideoPlayer 
          videoUrl={item.videoUrl} 
          isActive={true} // Pour le MVP, on la laisse active par défaut
        />

        {/* Superposition des informations textuelles (En bas à gauche) */}
        <View style={styles.bottomOverlay}>
          <Text style={styles.username}>@utilisateur_{item.userId.substring(0, 5)}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>

        {/* Superposition des boutons d'action (Sur le côté droit) */}
        <View style={styles.rightSidebar}>
          {/* BOUTON LIKE */}
          <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item.id)}>
            <Text style={styles.actionIcon}>❤️</Text>
            <Text style={styles.actionLabel}>{item.likesCount}</Text>
          </TouchableOpacity>

          {/* BOUTON COMMENTAIRE */}
          <TouchableOpacity style={styles.actionButton} onPress={() => console.log('Ouvrir les commentaires')}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>{item.commentsCount}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Chargement du Feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        snapToInterval={height} // Force l'alignement pile sur la hauteur de l'écran
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false} // Cache la barre de défilement pour faire propre
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' },
  loadingText: { color: 'white', fontSize: 16 },
  videoCard: { width: width, height: height, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  videoPlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  videoText: { color: '#555', fontSize: 16 },
  bottomOverlay: { position: 'absolute', bottom: 100, left: 15, width: width * 0.75 },
  username: { color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  description: { color: 'white', fontSize: 14 },
  rightSidebar: { position: 'absolute', bottom: 120, right: 15, alignItems: 'center' },
  actionButton: { alignItems: 'center', marginBottom: 20 },
  actionIcon: { fontSize: 35, marginBottom: 5 },
  actionLabel: { color: 'white', fontSize: 12, fontWeight: 'bold' }
});