import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { getErrorMessage, logger } from '../utils/logger';

export interface AuthResult {
  success: boolean;
  user?: FirebaseAuthTypes.User;
  error?: string;
}

/**
 * Service gérant la logique d'authentification Firebase.
 */
export const authService = {
  /**
   * Inscription d'un nouvel utilisateur et création de son profil dans Firestore.
   */
  register: async (
    email: string,
    password: string,
    username: string,
  ): Promise<AuthResult> => {
    try {
      // 1. Création de l'utilisateur dans Firebase Auth
      const userCredential = await auth().createUserWithEmailAndPassword(
        email.trim(),
        password,
      );
      const user = userCredential.user;

      // 2. Création du document utilisateur obligatoire dans Firestore
      await firestore()
        .collection('users')
        .doc(user.uid)
        .set({
          uid: user.uid,
          email: email.trim(),
          username: username.toLowerCase().trim(),
          avatarUrl: 'https://placeholder.com/avatar.png', // Avatar par défaut
          followersCount: 0,
          followingCount: 0,
          createdAt: Date.now(),
        });

      return { success: true, user };
    } catch (error: unknown) {
      logger.error('Erreur register :', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /**
   * Connexion d'un utilisateur existant.
   */
  login: async (email: string, password: string): Promise<AuthResult> => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(
        email.trim(),
        password,
      );
      return { success: true, user: userCredential.user };
    } catch (error: unknown) {
      logger.error('Erreur login :', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /**
   * Déconnexion.
   */
  logout: async (): Promise<AuthResult> => {
    try {
      await auth().signOut();
      return { success: true };
    } catch (error: unknown) {
      logger.error('Erreur logout :', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },
};
