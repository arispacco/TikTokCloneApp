import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Video from 'react-native-video';

const { width, height: WINDOW_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 66;
const VIDEO_HEIGHT = WINDOW_HEIGHT - TAB_BAR_HEIGHT;

interface VideoPlayerProps {
  videoUrl: string;
  isActive: boolean;
  shouldRender: boolean; // Pour economiser la RAM en ne montant pas le composant Video
}

export default function VideoPlayer({ videoUrl, isActive, shouldRender }: VideoPlayerProps) {
  if (!shouldRender) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Video
        source={{ uri: videoUrl }}
        style={styles.video}
        resizeMode="cover"
        repeat={true}
        paused={!isActive}
        muted={false}
        playInBackground={false}
        shutterColor="transparent"
        // Optimisation Android
        preventsDisplaySleepDuringVideoPlayback={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    height: VIDEO_HEIGHT,
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