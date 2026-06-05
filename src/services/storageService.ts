import storage from '@react-native-firebase/storage';
import { logger } from '../utils/logger';

/**
 * Service gérant l'hébergement des fichiers lourds (Images et Vidéos).
 */
export const storageService = {
  /**
   * Upload la photo de profil d'un utilisateur.
   * Conservé pour la future fonctionnalité d'édition de profil.
   */
  uploadAvatar: async (
    userId: string,
    filePath: string,
  ): Promise<string | null> => {
    try {
      const reference = storage().ref(`/users/${userId}/avatar.jpg`);
      await reference.putFile(filePath);
      return await reference.getDownloadURL();
    } catch (error: unknown) {
      logger.error('Erreur uploadAvatar :', error);
      return null;
    }
  },

  /**
   * Upload une vidéo TikTok et retourne son URL publique.
   */
  uploadVideo: async (
    postId: string,
    filePath: string,
  ): Promise<string | null> => {
    try {
      const reference = storage().ref(`/posts/${postId}/video.mp4`);
      await reference.putFile(filePath);
      return await reference.getDownloadURL();
    } catch (error: unknown) {
      logger.error('Erreur uploadVideo :', error);
      return null;
    }
  },
};
