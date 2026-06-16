/**
 * Contrat de données centralisé de l'application.
 *
 * Ces interfaces sont la source de vérité unique pour les structures
 * partagées entre les services, les écrans et les tests. On évite ainsi
 * la duplication (notamment de `Post`) à travers le code.
 */

/** Profil utilisateur tel que stocké dans la collection Firestore `users`. */
export interface User {
  uid: string;
  email: string;
  username: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
  createdAt: number;
}

/** Vidéo publiée telle que stockée dans la collection Firestore `posts`. */
export interface Post {
  id: string;
  userId: string;
  videoUrl: string;
  title?: string;
  description: string;
  likesCount: number;
  commentsCount: number;
  createdAt: number;
}

/** Données nécessaires à la création d'un nouveau post (avant écriture Firestore). */
export interface CreatePostInput {
  userId: string;
  videoLocalPath: string;
  title?: string;
  description: string;
}

/** Commentaire sur un post tel que stocké dans la sous-collection `comments`. */
export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: number;
}

/** Son partagé utilisable en arrière-plan d'une vidéo. */
export interface Sound {
  id: string;
  title: string;
  url: string;
  creatorId: string;
  createdAt: number;
}
