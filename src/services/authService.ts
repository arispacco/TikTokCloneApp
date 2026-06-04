import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

/**
 * Service gérant la logique d'authentification Firebase
 */
export const authService = {
  /**
   * Inscription d'un nouvel utilisateur et création de son profil dans Firestore
   */
  register: async (email: string, password: string, username: string) => {
    try {
      // 1. Création de l'utilisateur dans Firebase Auth
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // 2. Création du document utilisateur obligatoire dans Firestore
      await firestore().collection('users').doc(user.uid).set({
        uid: user.uid,
        email: email,
        username: username.toLowerCase().trim(),
        avatarUrl: 'https://placeholder.com/avatar.png', // Avatar par défaut
        followersCount: 0,
        followingCount: 0,
        createdAt: Date.now(),
      });

      return { success: true, user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Connexion d'un utilisateur existant
   */
  login: async (email: string, password: string) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Déconnexion
   */
  logout: async () => {
    try {
      await auth().signOut();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};