import firestore from '@react-native-firebase/firestore';
import { storageService } from './storageService';
import { Comment, CreatePostInput, Post } from '../shared/contracts';
import { getErrorMessage, logger } from '../utils/logger';

export interface ToggleLikeResult {
  success: boolean;
  /** `true` si le post est désormais liké, `false` s'il a été déliké. */
  liked: boolean;
}

export interface CreatePostResult {
  success: boolean;
  post?: Post;
  error?: string;
}

export const postService = {
  /**
   * Récupère le fil d'actualité (les dernières vidéos publiées).
   * On limite à 10 pour ne pas exploser le forfait Firestore.
   *
   * Les erreurs ne sont PLUS avalées silencieusement : elles sont propagées
   * pour que l'UI puisse afficher un état d'erreur avec retry.
   */
  getFeed: async (): Promise<Post[]> => {
    const snapshot = await firestore()
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return snapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Post),
    );
  },

  /**
   * Récupère les publications d'un utilisateur spécifique.
   */
  getUserPosts: async (userId: string): Promise<Post[]> => {
    const snapshot = await firestore()
      .collection('posts')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Post),
    );
  },

  /**
   * Crée un post : upload de la vidéo vers Storage puis écriture du document
   * Firestore. Toute la logique d'écriture est centralisée ici (les écrans
   * n'écrivent plus directement dans Firestore).
   */
  createPost: async ({
    userId,
    videoLocalPath,
    description,
  }: CreatePostInput): Promise<CreatePostResult> => {
    try {
      // 1. Identifiant de document unique
      const postRef = firestore().collection('posts').doc();
      const postId = postRef.id;

      // 2. Upload du fichier vidéo vers Firebase Storage
      const cloudVideoUrl = await storageService.uploadVideo(
        postId,
        videoLocalPath,
      );

      if (!cloudVideoUrl) {
        return {
          success: false,
          error: "L'envoi de la vidéo a échoué. Réessaie.",
        };
      }

      // 3. Écriture de la fiche finale dans Firestore
      const post: Post = {
        id: postId,
        userId,
        videoUrl: cloudVideoUrl,
        description: description.trim(),
        likesCount: 0,
        commentsCount: 0,
        createdAt: Date.now(),
      };
      await postRef.set(post);

      return { success: true, post };
    } catch (error: unknown) {
      logger.error('Erreur createPost :', error);
      return { success: false, error: getErrorMessage(error) };
    }
  },

  /**
   * Ajoute ou retire un J'aime sur une vidéo.
   * Renvoie l'état final (`liked`) pour que l'UI ajuste le compteur de +1/-1.
   */
  toggleLike: async (
    postId: string,
    userId: string,
  ): Promise<ToggleLikeResult> => {
    const postRef = firestore().collection('posts').doc(postId);
    const likeRef = postRef.collection('likes').doc(userId);

    try {
      // Transaction pour éviter les conflits de likes concurrents.
      const liked = await firestore().runTransaction(async transaction => {
        const likeDoc = await transaction.get(likeRef);
        const postDoc = await transaction.get(postRef);

        if (!postDoc.exists()) {
          throw new Error("Le post n'existe plus !");
        }

        const currentLikes = postDoc.data()?.likesCount || 0;

        if (likeDoc.exists()) {
          // Déjà liké : on retire le like (jamais en dessous de 0).
          transaction.delete(likeRef);
          transaction.update(postRef, {
            likesCount: Math.max(0, currentLikes - 1),
          });
          return false;
        }

        // Nouveau like.
        transaction.set(likeRef, { userId, createdAt: Date.now() });
        transaction.update(postRef, { likesCount: currentLikes + 1 });
        return true;
      });

      return { success: true, liked };
    } catch (error: unknown) {
      logger.error('Erreur lors du toggleLike :', error);
      return { success: false, liked: false };
    }
  },

  /**
   * Récupère les commentaires d'une vidéo spécifique.
   */
  getComments: async (postId: string): Promise<Comment[]> => {
    const snapshot = await firestore()
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Comment),
    );
  },

  /**
   * Ajoute un commentaire sur une vidéo.
   */
  addComment: async (
    postId: string,
    userId: string,
    username: string,
    text: string,
  ): Promise<boolean> => {
    const postRef = firestore().collection('posts').doc(postId);
    const commentRef = postRef.collection('comments').doc();

    try {
      await firestore().runTransaction(async transaction => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) throw new Error("Post introuvable");

        const currentComments = postDoc.data()?.commentsCount || 0;

        transaction.set(commentRef, {
          userId,
          username,
          text: text.trim(),
          createdAt: Date.now(),
        });

        transaction.update(postRef, {
          commentsCount: currentComments + 1,
        });
      });
      return true;
    } catch (error) {
      logger.error('Erreur addComment :', error);
      return false;
    }
  },
};
