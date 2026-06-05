import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { storageService } from '../services/storageService';
import firestore from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');

export default function CameraScreen() {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back'); // Utilise la caméra arrière par défaut

  // --- LES ÉTATS (STATES) DE L'INTERFACE ---
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [videoLocalPath, setVideoLocalPath] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // --- 1. GESTION DES PERMISSIONS AU DÉMARRAGE ---
  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermission();
      const audioStatus = await Camera.requestMicrophonePermission();
      setHasPermission(cameraStatus === 'granted' && audioStatus === 'granted');
    })();
  }, []);

  // --- 2. LOGIQUE DE L'ENREGISTREMENT ---
  const handleRecordVideo = async () => {
    if (!cameraRef.current) return;

    if (isRecording) {
      // Si on est déjà en train de filmer, on arrête
      await cameraRef.current.stopRecording();
      setIsRecording(false);
    } else {
      // Sinon, on commence à filmer
      setIsRecording(true);
      cameraRef.current.startRecording({
        onRecordingFinished: (video) => {
          // Cette fonction se déclenche automatiquement quand la vidéo est prête sur le téléphone
          setVideoLocalPath(video.path);
        },
        onRecordingError: (error) => {
          console.error("Erreur enregistrement caméra :", error);
          setIsRecording(false);
        },
      });
    }
  };

  // --- 3. LOGIQUE D'UPLOAD ET PUBLICATION FIRESTORE ---
  const handlePublish = async () => {
    if (!videoLocalPath || isUploading) return;

    setIsUploading(true);
    try {
      // Étape A : Générer un identifiant de document unique dans Firestore
      const postRef = firestore().collection('posts').doc();
      const postId = postRef.id;

      // Étape B : Envoyer le fichier vidéo vers Firebase Storage
      const cloudVideoUrl = await storageService.uploadVideo(postId, videoLocalPath);

      if (cloudVideoUrl) {
        // Étape C : Enregistrer la fiche finale dans Firestore
        await postRef.set({
          id: postId,
          userId: "current_user_123", // ID câblé en dur pour le MVP
          videoUrl: cloudVideoUrl,
          description: description,
          likesCount: 0,
          commentsCount: 0,
          createdAt: Date.now(),
        });

        // Étape D : Nettoyage de l'interface après succès
        setVideoLocalPath(null);
        setDescription('');
        Alert.alert("Vidéo publiée avec succès !");
      }
    } catch (error) {
      console.error("Erreur lors de la publication :", error);
      Alert.alert("Échec de la publication.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- GESTION DES ÉCRANS D'ATTENTE ---
  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>L'application a besoin des permissions Caméra et Micro pour fonctionner.</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Aucun capteur photo détecté sur l'appareil.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* LE VISEUR DE LA CAMÉRA */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={videoLocalPath === null} // Coupe la caméra si on est en train de configurer la publication
        video={true}
        audio={true}
      />

      {/* INTERFACE 1 : Mode Enregistrement (Viseur actif) */}
      {videoLocalPath === null && (
        <View style={styles.cameraOverlay}>
          <TouchableOpacity 
            style={[styles.recordButton, isRecording && styles.recordButtonActive]} 
            onPress={handleRecordVideo}
          >
            <View style={styles.recordButtonInner} />
          </TouchableOpacity>
          <Text style={styles.hintText}>
            {isRecording ? "Appuie pour arrêter" : "Appuie pour filmer"}
          </Text>
        </View>
      )}

      {/* INTERFACE 2 : Mode Publication (Le fichier est enregistré, on attend la description) */}
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
          />

          <TouchableOpacity 
            style={styles.publishButton} 
            onPress={handlePublish}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.publishButtonText}>Partager la vidéo</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => setVideoLocalPath(null)}>
            <Text style={styles.cancelButtonText}>Recommencer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black', padding: 20 },
  text: { color: 'white', textAlign: 'center', fontSize: 16 },
  cameraOverlay: { position: 'absolute', bottom: 50, width: width, alignItems: 'center' },
  recordButton: { width: 80, height: 80, borderRadius: 40, borderWidth: 5, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  recordButtonActive: { borderColor: '#ff0050' },
  recordButtonInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ff0050' },
  hintText: { color: 'white', marginTop: 10, fontWeight: 'bold', textShadowColor: 'black', textShadowRadius: 2 },
  publishOverlay: { position: 'absolute', bottom: 0, width: width, backgroundColor: 'rgba(0,0,0,0.9)', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, alignItems: 'center' },
  publishTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { width: '100%', height: 80, backgroundColor: '#1e1e1e', borderRadius: 10, color: 'white', padding: 10, textAlignVertical: 'top', marginBottom: 20 },
  publishButton: { width: '100%', height: 50, backgroundColor: '#ff0050', borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  publishButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { width: '100%', height: 40, justifyContent: 'center', alignItems: 'center' },
  cancelButtonText: { color: '#888', fontSize: 14 }
});