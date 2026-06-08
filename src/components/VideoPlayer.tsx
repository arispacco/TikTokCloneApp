import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Video from 'react-native-video';

// Récupération de la taille de l'écran du téléphone
const { width, height } = Dimensions.get('window');

interface VideoPlayerProps {
  videoUrl: string;
  isActive: boolean; // Permet de savoir si la vidéo est visible à l'écran
}

export default function VideoPlayer({ videoUrl, isActive }: VideoPlayerProps) {
  return (
    <View style={styles.container}>
      <Video
        source={{ uri: videoUrl }} // L'URL de la vidéo stockée sur Firebase
        style={styles.video}
        resizeMode="cover" // Aligne et recadre la vidéo pour remplir 100% de l'écran (style TikTok)
        repeat={true} // Relance la vidéo en boucle automatiquement quand elle interagit avec la fin
        paused={!isActive} // Met la vidéo en pause si l'utilisateur a scrollé sur une autre vidéo
        muted={false} // Active le son par défaut
        playInBackground={false} // Coupe la vidéo si l'utilisateur quitte l'application
        shutterColor="transparent" // Évite un flash noir au chargement
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    height: height,
    backgroundColor: '#000000',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});