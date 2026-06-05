import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import auth from '@react-native-firebase/auth';
import { useIsFocused } from '@react-navigation/native';
import { postService } from '../services/postService';
import { logger } from '../utils/logger';

const { width } = Dimensions.get('window');

export default function CameraScreen(): React.JSX.Element {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const isFocused = useIsFocused();

  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [videoLocalPath, setVideoLocalPath] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermission();
      const audioStatus = await Camera.requestMicrophonePermission();
      setHasPermission(cameraStatus === 'granted' && audioStatus === 'granted');
    })();
  }, []);

  const handleRecordVideo = async () => {
    if (!cameraRef.current) {
      return;
    }

    if (isRecording) {
      await cameraRef.current.stopRecording();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      cameraRef.current.startRecording({
        onRecordingFinished: video => {
          setVideoLocalPath(video.path);
        },
        onRecordingError: error => {
          logger.error('Erreur enregistrement caméra :', error);
          setIsRecording(false);
        },
      });
    }
  };

  const handlePublish = async () => {
    if (!videoLocalPath || isUploading) {
      return;
    }

    const userId = auth().currentUser?.uid;
    if (!userId) {
      Alert.alert('Connexion requise', 'Connecte-toi pour publier une vidéo.');
      return;
    }

    setIsUploading(true);
    try {
      const result = await postService.createPost({
        userId,
        videoLocalPath,
        description,
      });

      if (result.success) {
        setVideoLocalPath(null);
        setDescription('');
        Alert.alert('Vidéo publiée avec succès !');
      } else {
        Alert.alert(
          'Échec de la publication',
          result.error ?? 'Réessaie dans un instant.',
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>
          L'application a besoin des permissions Caméra et Micro pour
          fonctionner.
        </Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>
          Aucun capteur photo détecté sur l'appareil.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        // Caméra coupée hors focus d'onglet ou pendant la phase de publication.
        isActive={isFocused && videoLocalPath === null}
        video={true}
        audio={true}
      />

      {videoLocalPath === null && (
        <View style={styles.cameraOverlay}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
            ]}
            onPress={handleRecordVideo}
            accessibilityRole="button"
            accessibilityLabel={
              isRecording ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement"
            }
          >
            <View style={styles.recordButtonInner} />
          </TouchableOpacity>
          <Text style={styles.hintText}>
            {isRecording ? 'Appuie pour arrêter' : 'Appuie pour filmer'}
          </Text>
        </View>
      )}

      {videoLocalPath !== null && (
        <View style={styles.publishOverlay}>
          <Text style={styles.publishTitle}>✍️ Légende de ton TikTok</Text>

          <TextInput
            style={styles.input}
            placeholder="Écris une description sympa... #TikTokClone"
            placeholderTextColor="#888"
            value={description}
            onChangeText={setDescription}
            multiline={true}
            maxLength={150}
            accessibilityLabel="Champ description de la vidéo"
          />

          <TouchableOpacity
            style={styles.publishButton}
            onPress={handlePublish}
            disabled={isUploading}
            accessibilityRole="button"
            accessibilityLabel="Partager la vidéo"
          >
            {isUploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.publishButtonText}>Partager la vidéo</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setVideoLocalPath(null)}
            disabled={isUploading}
            accessibilityRole="button"
            accessibilityLabel="Recommencer l'enregistrement"
          >
            <Text style={styles.cancelButtonText}>Recommencer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 20,
  },
  text: { color: 'white', textAlign: 'center', fontSize: 16 },
  cameraOverlay: {
    position: 'absolute',
    bottom: 50,
    width: width,
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: { borderColor: '#ff0050' },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff0050',
  },
  hintText: {
    color: 'white',
    marginTop: 10,
    fontWeight: 'bold',
    textShadowColor: 'black',
    textShadowRadius: 2,
  },
  publishOverlay: {
    position: 'absolute',
    bottom: 0,
    width: width,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  publishTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 80,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    color: 'white',
    padding: 10,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  publishButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#ff0050',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  publishButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cancelButton: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: { color: '#888', fontSize: 14 },
});
