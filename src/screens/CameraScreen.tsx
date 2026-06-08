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
  ScrollView,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import auth from '@react-native-firebase/auth';
import { useIsFocused } from '@react-navigation/native';
import {
  Archive,
  ArrowLeft,
  AtSign,
  ChevronDown,
  Globe2,
  Grid3X3,
  Hash,
  Image as ImageIcon,
  Lightbulb,
  Link,
  Maximize2,
  Mic,
  Music,
  RotateCw,
  Settings,
  Share2,
  Sparkles,
  Timer,
  Upload,
  X,
  Zap,
} from 'lucide-react-native';
import { postService } from '../services/postService';
import { logger } from '../utils/logger';

const { width } = Dimensions.get('window');

const cameraTools = [
  { id: 'rotate', label: 'Retourner', icon: RotateCw },
  { id: 'effects', label: 'Effets', icon: Zap },
  { id: 'timer', label: 'Minuteur', icon: Timer },
  { id: 'grid', label: 'Grille', icon: Grid3X3 },
  { id: 'mic', label: 'Micro', icon: Mic },
  { id: 'expand', label: 'Agrandir', icon: Maximize2 },
  { id: 'more', label: 'Plus', icon: ChevronDown },
];

const publishOptions = [
  { id: 'disclosure', label: 'Divulgation de contenu et publicités', icon: Archive },
  { id: 'link', label: 'Ajouter un lien', icon: Link },
  { id: 'visibility', label: 'Tout le monde peut voir cette publication', icon: Globe2 },
  { id: 'more', label: "Plus d'options", icon: Settings },
  { id: 'share', label: 'Partager sur', icon: Share2 },
];

export default function CameraScreen(): React.JSX.Element {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const isFocused = useIsFocused();

  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [videoLocalPath, setVideoLocalPath] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
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
        setTitle('');
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
        <View style={styles.cameraUi}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => logger.debug('Fermer la camera')}
              accessibilityRole="button"
              accessibilityLabel="Fermer la camera"
            >
              <X color="#ffffff" size={34} strokeWidth={2.2} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.soundButton}
              onPress={() => logger.debug('Ajouter un son')}
              accessibilityRole="button"
              accessibilityLabel="Ajouter un son"
            >
              <Music color="#ffffff" size={20} strokeWidth={2.4} />
              <Text style={styles.soundButtonText}>Ajouter un son</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toolRail}>
            {cameraTools.map(({ id, label, icon: Icon }) => (
              <TouchableOpacity
                key={id}
                style={styles.toolButton}
                onPress={() => logger.debug(`Outil camera : ${id}`)}
                accessibilityRole="button"
                accessibilityLabel={label}
              >
                <Icon color="#ffffff" size={31} strokeWidth={2.2} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.captureArea}>
            <View style={styles.modeRow}>
              <Text style={styles.modeText}>60 s</Text>
              <Text style={styles.modeText}>15 s</Text>
              <Text style={[styles.modeText, styles.activeModeText]}>PHOTO</Text>
              <Text style={styles.modeText}>TEXTE</Text>
            </View>

            <View style={styles.captureRow}>
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={() => logger.debug('Ouvrir la galerie')}
                accessibilityRole="button"
                accessibilityLabel="Ouvrir la galerie"
              >
                <ImageIcon color="#ffffff" size={28} strokeWidth={2.2} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording && styles.recordButtonActive,
                ]}
                onPress={handleRecordVideo}
                accessibilityRole="button"
                accessibilityLabel={
                  isRecording
                    ? "Arrêter l'enregistrement"
                    : "Démarrer l'enregistrement"
                }
              >
                <View
                  style={[
                    styles.recordButtonInner,
                    isRecording && styles.recordButtonInnerActive,
                  ]}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.effectButton}
                onPress={() => logger.debug('Ouvrir les effets')}
                accessibilityRole="button"
                accessibilityLabel="Ouvrir les effets"
              >
                <Zap color="#ffffff" size={27} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            <Text style={styles.hintText}>
              {isRecording ? 'Appuie pour arrêter' : 'Appuie pour filmer'}
            </Text>

            <View style={styles.creationTabs}>
              <Text style={styles.creationTab}>LIVE</Text>
              <Text style={[styles.creationTab, styles.creationTabActive]}>
                PUBLIER
              </Text>
              <Text style={styles.creationTab}>CRÉER</Text>
            </View>
          </View>
        </View>
      )}

      {videoLocalPath !== null && (
        <View style={styles.publishScreen}>
          <View style={styles.publishHeader}>
            <TouchableOpacity
              style={styles.publishHeaderButton}
              onPress={() => setVideoLocalPath(null)}
              disabled={isUploading}
              accessibilityRole="button"
              accessibilityLabel="Retour à la caméra"
            >
              <ArrowLeft color="#000000" size={34} strokeWidth={2.4} />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>Aperçu</Text>
          </View>

          <ScrollView
            style={styles.publishScroll}
            contentContainerStyle={styles.publishContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.coverThumb}>
              <Text style={styles.coverLabel}>Couverture</Text>
            </View>

            <TextInput
              style={styles.titleInput}
              placeholder="Ajoute un titre accrocheur"
              placeholderTextColor="#a8a8a8"
              value={title}
              onChangeText={setTitle}
              maxLength={80}
              accessibilityLabel="Champ titre de la vidéo"
            />

            <TextInput
              style={styles.descriptionInput}
              placeholder="Rédiger une description longue peut permettre d'obtenir 3x plus de vues en moyenne."
              placeholderTextColor="#a8a8a8"
              value={description}
              onChangeText={setDescription}
              multiline={true}
              maxLength={2200}
              accessibilityLabel="Champ description de la vidéo"
            />

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionButton}
                accessibilityRole="button"
                accessibilityLabel="Ajouter un hashtag"
              >
                <Hash color="#000000" size={30} strokeWidth={2.3} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionButton}
                accessibilityRole="button"
                accessibilityLabel="Mentionner un utilisateur"
              >
                <AtSign color="#000000" size={29} strokeWidth={2.3} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionButton}
                accessibilityRole="button"
                accessibilityLabel="Suggestions"
              >
                <Lightbulb color="#000000" size={28} strokeWidth={2.3} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.aiButton}
                accessibilityRole="button"
                accessibilityLabel="Réécrire avec l'IA"
              >
                <Sparkles color="#9b9b9b" size={20} strokeWidth={2.4} />
                <Text style={styles.aiButtonText}>Réécrire avec l'IA</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionButton}
                accessibilityRole="button"
                accessibilityLabel="Agrandir"
              >
                <Maximize2 color="#000000" size={27} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            <View style={styles.optionList}>
              {publishOptions.map(({ id, label, icon: Icon }) => (
                <TouchableOpacity
                  key={id}
                  style={styles.optionRow}
                  onPress={() => logger.debug(`Option publication : ${id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                >
                  <Icon color="#000000" size={29} strokeWidth={2.3} />
                  <Text style={styles.optionLabel}>{label}</Text>
                  <ChevronDown
                    color="#8c8c8c"
                    size={28}
                    strokeWidth={2.2}
                    style={styles.optionChevron}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.publishFooter}>
            <TouchableOpacity
              style={styles.draftButton}
              onPress={() => logger.debug('Enregistrer en brouillon')}
              disabled={isUploading}
              accessibilityRole="button"
              accessibilityLabel="Enregistrer en brouillon"
            >
              <Archive color="#000000" size={24} strokeWidth={2.4} />
              <Text style={styles.draftButtonText}>Brouillons</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.publishButton}
              onPress={handlePublish}
              disabled={isUploading}
              accessibilityRole="button"
              accessibilityLabel="Publier la vidéo"
            >
              {isUploading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Upload color="#ffffff" size={24} strokeWidth={2.5} />
                  <Text style={styles.publishButtonText}>Publier</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
  cameraUi: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  topBar: {
    position: 'absolute',
    top: 30,
    left: 20,
    right: 20,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    left: 0,
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundButton: {
    height: 50,
    minWidth: 216,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.42)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  soundButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
  },
  toolRail: {
    position: 'absolute',
    top: 98,
    right: 14,
    alignItems: 'center',
  },
  toolButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  captureArea: {
    position: 'absolute',
    bottom: 18,
    width: width,
    alignItems: 'center',
  },
  modeRow: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modeText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 17,
    fontWeight: '800',
    marginHorizontal: 13,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowRadius: 3,
  },
  activeModeText: {
    color: '#111111',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    paddingHorizontal: 17,
    paddingVertical: 8,
  },
  captureRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryButton: {
    position: 'absolute',
    left: 26,
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectButton: {
    position: 'absolute',
    right: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 5,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: { borderColor: '#ff2d55' },
  recordButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffffff',
  },
  recordButtonInnerActive: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#ff2d55',
  },
  hintText: {
    color: 'white',
    marginTop: 8,
    fontWeight: '800',
    textShadowColor: 'black',
    textShadowRadius: 2,
  },
  creationTabs: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  creationTab: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 17,
    fontWeight: '800',
    marginHorizontal: 20,
  },
  creationTabActive: {
    color: '#ffffff',
    fontSize: 18,
  },
  publishScreen: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#ffffff',
  },
  publishHeader: {
    height: 88,
    paddingTop: 30,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  publishHeaderButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    color: '#000000',
    fontSize: 27,
    fontWeight: '800',
  },
  publishScroll: { flex: 1 },
  publishContent: {
    paddingHorizontal: 24,
    paddingBottom: 18,
  },
  coverThumb: {
    width: 128,
    height: 128,
    borderRadius: 12,
    backgroundColor: '#7f8a8d',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 24,
  },
  coverLabel: {
    alignSelf: 'flex-start',
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.35)',
    fontSize: 22,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  titleInput: {
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e4',
    color: '#000000',
    fontSize: 26,
    fontWeight: '800',
    paddingVertical: 8,
  },
  descriptionInput: {
    minHeight: 180,
    color: '#000000',
    fontSize: 23,
    lineHeight: 34,
    paddingTop: 18,
    textAlignVertical: 'top',
  },
  quickActions: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  quickActionButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#f4f4f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiButton: {
    height: 48,
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#f7f7f7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    paddingHorizontal: 10,
  },
  aiButtonText: {
    color: '#9b9b9b',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 6,
  },
  optionList: { paddingTop: 16 },
  optionRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    flex: 1,
    color: '#000000',
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 14,
  },
  optionChevron: {
    transform: [{ rotate: '-90deg' }],
  },
  publishFooter: {
    height: 96,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingHorizontal: 24,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  draftButton: {
    flex: 1,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#eeeeee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  draftButtonText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 8,
  },
  publishButton: {
    flex: 1,
    height: 58,
    backgroundColor: '#ff2d55',
    borderRadius: 29,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 8,
  },
});
