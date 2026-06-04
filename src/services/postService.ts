import firestore from '@react-native-firebase/firestore';

// On définit la structure d'un post pour TypeScript
export interface Post {
  id: string;
  userId: string;
  videoUrl: string;
  description: string;
  likesCount: number;
  commentsCount: number;
  createdAt: number;
}

export const postService = {
  /**
   * Récupère le fil d'actualité (les dernières vidéos publiées)
   * On limite à 10 pour ne pas exploser le forfait Firestore
   */
  getFeed: async (): Promise<Post[]> => {
    try {
      const snapshot = await firestore()
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Post));
    } catch (error) {
      console.error("Erreur lors de la récupération du feed :", error);
      return [];
    }
  },

  /**
   * Ajoute ou retire un J'aime sur une vidéo
   */
  toggleLike: async (postId: string, userId: string) => {
    const postRef = firestore().collection('posts').doc(postId);
    const likeRef = postRef.collection('likes').doc(userId);

    try {
      // On utilise une transaction pour éviter les conflits si 1000 personnes likent en même temps
      await firestore().runTransaction(async (transaction) => {
        const likeDoc = await transaction.get(likeRef);
        const postDoc = await transaction.get(postRef);

        if (!postDoc.exists()) throw new Error("Le post n'existe plus !");

        const currentLikes = postDoc.data()?.likesCount || 0;

        if (likeDoc.exists()) {
          // L'utilisateur a déjà liké, on retire le like
          transaction.delete(likeRef);
          transaction.update(postRef, { likesCount: currentLikes - 1 });
        } else {
          // Nouveau like
          transaction.set(likeRef, { userId, createdAt: Date.now() });
          transaction.update(postRef, { likesCount: currentLikes + 1 });
        }
      });
      return { success: true };
    } catch (error) {
      console.error("Erreur lors du toggleLike :", error);
      return { success: false };
    }
  }
};