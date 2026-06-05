import storage from '@react-native-firebase/storage';

/**
 * Service gérant l'hébergement des fichiers lourds (Images et Vidéos)
 */
export const storageService = {

  /**
   * Upload la photo de profil d'un utilisateur
   */
  uploadAvatar: async (userId: string, filePath: string): Promise<string | null> => {
    try {
      const reference = storage().ref(`/users/${userId}/avatar.jpg`);
      await reference.putFile(filePath);
      const downloadUrl = await reference.getDownloadURL();
      return downloadUrl;
    } catch (error) {
      console.error("Erreur uploadAvatar :", error);
      return null;
    }
  },

  /**
   * Upload une vidéo TikTok et retourne son URL publique
   */
  uploadVideo: async (postId: string, filePath: string): Promise<string | null> => {
    try {
      const reference = storage().ref(`/posts/${postId}/video.mp4`);
      await reference.putFile(filePath);
      const downloadUrl = await reference.getDownloadURL();
      return downloadUrl;
    } catch (error) {
      console.error("Erreur uploadVideo :", error);
      return null;
    }
  }
};