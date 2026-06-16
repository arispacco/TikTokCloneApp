import React from 'react';
import { StyleSheet, View, Dimensions, Animated } from 'react-native';
import Video from 'react-native-video';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Heart, Play } from 'lucide-react-native';

const { width, height: WINDOW_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 66;
const VIDEO_HEIGHT = WINDOW_HEIGHT - TAB_BAR_HEIGHT;

interface VideoPlayerProps {
  videoUrl: string;
  isActive: boolean;
  shouldRender: boolean; // Pour économiser la RAM en ne montant pas le composant Video
  onDoubleTap?: () => void;
}

interface FloatingHeartItemProps {
  x: number;
  y: number;
  onComplete: () => void;
}

function FloatingHeartItem({ x, y, onComplete }: FloatingHeartItemProps) {
  const scale = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;
  const translateY = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Séquence d'animation en pure native driver (60 FPS)
    Animated.sequence([
      // 1. Pop rapide (zoom)
      Animated.spring(scale, {
        toValue: 1.4,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      // 2. Léger retour au format standard
      Animated.spring(scale, {
        toValue: 1.0,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.delay(200),
      // 3. Dérive vers le haut et fondu
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete();
    });
  }, [scale, translateY, opacity, onComplete]);

  return (
    <Animated.View
      style={[
        styles.floatingHeart,
        {
          left: x - 40, // Centrer le cœur (largeur de 80 / 2)
          top: y - 40,  // Centrer le cœur
          transform: [{ scale }, { translateY }],
          opacity,
        },
      ]}
    >
      <Heart fill="#ff2d55" color="#ff2d55" size={80} />
    </Animated.View>
  );
}

export default function VideoPlayer({
  videoUrl,
  isActive,
  shouldRender,
  onDoubleTap,
}: VideoPlayerProps): React.JSX.Element {
  const [localPaused, setLocalPaused] = React.useState<boolean>(false);
  const [hearts, setHearts] = React.useState<{ id: number; x: number; y: number }[]>([]);
  const heartIdCounter = React.useRef<number>(0);

  // Réinitialiser l'état de pause interne dès que la vidéo perd le focus
  React.useEffect(() => {
    if (!isActive) {
      setLocalPaused(false);
    }
  }, [isActive]);

  const handleDoubleTap = React.useCallback((x: number, y: number) => {
    const newId = heartIdCounter.current++;
    setHearts(prev => [...prev, { id: newId, x, y }]);
    if (onDoubleTap) {
      onDoubleTap();
    }
  }, [onDoubleTap]);

  const handleSingleTap = React.useCallback(() => {
    setLocalPaused(prev => !prev);
  }, []);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .runOnJS(true)
    .onStart((event) => {
      handleDoubleTap(event.x, event.y);
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .runOnJS(true)
    .requireExternalGestureToFail(doubleTap)
    .onStart(() => {
      handleSingleTap();
    });

  const composedGesture = Gesture.Exclusive(doubleTap, singleTap);

  if (!shouldRender) {
    return <View style={styles.container} />;
  }

  const isPaused = !isActive || localPaused;

  const removeHeart = (id: number) => {
    setHearts(prev => prev.filter(h => h.id !== id));
  };

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={styles.container}>
        <Video
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode="cover"
          repeat={true}
          paused={isPaused}
          muted={false}
          playInBackground={false}
          shutterColor="transparent"
          preventsDisplaySleepDuringVideoPlayback={true}
        />

        {/* Cœurs d'animation affichés par double tap */}
        {hearts.map(heart => (
          <FloatingHeartItem
            key={heart.id}
            x={heart.x}
            y={heart.y}
            onComplete={() => removeHeart(heart.id)}
          />
        ))}

        {/* Overlay visuel indiquant la pause */}
        {localPaused && (
          <View style={styles.playOverlay} pointerEvents="none">
            <Play color="rgba(255,255,255,0.68)" size={72} fill="rgba(255,255,255,0.22)" />
          </View>
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000000',
    position: 'relative',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  floatingHeart: {
    position: 'absolute',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
});