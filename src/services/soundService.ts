import firestore from '@react-native-firebase/firestore';
import { storageService } from './storageService';
import { Sound } from '../shared/contracts';
import { logger } from '../utils/logger';

export const soundService = {
  /**
   * Récupère la liste de tous les sons disponibles sur la plateforme.
   */
  getSounds: async (): Promise<Sound[]> => {
    try {
      const snapshot = await firestore()
        .collection('sounds')
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map(doc => doc.data() as Sound);
    } catch (error) {
      logger.error('Erreur getSounds :', error);
      return [];
    }
  },

  /**
   * Ajoute un nouveau son : upload vers Storage puis fiche Firestore.
   */
  createSound: async (
    title: string,
    creatorId: string,
    fileLocalPath: string
  ): Promise<Sound | null> => {
    try {
      const cleanTitle = title.trim();
      if (!cleanTitle) return null;

      // 1. Générer un ID unique de son
      const docRef = firestore().collection('sounds').doc();
      const soundId = docRef.id;

      // 2. Upload du fichier vers Storage
      const url = await storageService.uploadSound(soundId, fileLocalPath);
      if (!url) {
        logger.error("L'upload du fichier audio a échoué.");
        return null;
      }

      // 3. Enregistrement dans Firestore
      const newSound: Sound = {
        id: soundId,
        title: cleanTitle,
        url,
        creatorId,
        createdAt: Date.now(),
      };

      await docRef.set(newSound);
      return newSound;
    } catch (error) {
      logger.error('Erreur createSound :', error);
      return null;
    }
  }
};
