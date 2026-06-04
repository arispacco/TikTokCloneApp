---

# 📱 TikTokCloneApp

Bienvenue dans le dépôt officiel de **TikTokCloneApp** ! Ce projet a pour objectif de reproduire les fonctionnalités majeures de TikTok afin de maîtriser le développement mobile avec **React Native**, la gestion de base de données asynchrone avec **Firebase**, et le travail collaboratif sur **GitHub**.

---

## 🚀 Installation et Premier Lancement

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-organisation/TikTokCloneApp.git
cd TikTokCloneApp

```

### 2. Installer les dépendances

```bash
npm install

```

### 3. Lancer le serveur Metro (Terminal 1)

Le serveur Metro assemble le code JavaScript en temps réel.

```bash
npx react-native start --reset-cache

```

### 4. Lancer l'application (Terminal 2)

* **Sur Émulateur Android :**
```bash
npx react-native run-android

```


* **Sur un vrai appareil Android (USB) :** Active le débogage USB sur ton téléphone, branche-le, puis exécute cette commande indispensable pour lier le serveur Metro à ton téléphone avant de lancer l'app :
```bash
adb reverse tcp:8081 tcp:8081
npx react-native run-android

```



---

## 📁 Structure et Contrat de Données

Pour travailler en parallèle sans bloquer les autres, nous utilisons un **Contrat de Données centralisé** situé dans `src/shared/contracts.ts`. Personne ne doit modifier ce fichier sans l'accord de toute l'équipe.

### Aperçu du contrat (`src/shared/contracts.ts`) :

```typescript
export interface User {
  uid: string;
  username: string;
  avatarUrl: string;
}

export interface Post {
  id: string;
  videoUrl: string;
  description: string;
  likesCount: number;
  commentsCount: number;
  createdAt: number;
  userId: string;
}

```

---

## 🧩 Rôle Spécifique des Modules

Le projet est découpé en modules isolés. Chacun travaille **uniquement** dans son dossier dédié.

### 🎨 1. navigationUI

* **Rôle :** Créer le squelette visuel et l'arborescence de l'application.
* **Dossier cible :** `src/navigation/` et `src/components/common/`
* **Travail à fournir :** Mettre en place `React Navigation`. Configurer la barre d'onglets inférieure (*Bottom Tab Navigator*) avec les 5 icônes (Accueil, Découvrir, Créer `+`, Boîte de réception, Profil). Définir le thème sombre (fond noir `#010101`, texte blanc, accents rouge `#FE2C55`).
* **Exporte :** `AppNavigator`, `BottomTabNavigator`, `CustomButton`.

### 🎬 2. videoEngine

* **Rôle :** Gérer le défilement vertical et la lecture fluide des vidéos.
* **Dossier cible :** `src/screens/Home/` et `src/components/Video/`
* **Travail à fournir :** Créer le flux vertical principal. Utiliser `FlashList` pour charger les vidéos. Implémenter la logique de détection de scroll : seule la vidéo qui est à 100% visible au centre de l'écran doit se lancer (`paused={false}`), les autres doivent être immédiatement mises en pause pour préserver les performances de l'appareil.
* **Exporte :** `HomeScreen` (contenant la liste), `VideoPlayerCard`.

### 🔐 3. firebaseBackend

* **Rôle :** Gérer l'infrastructure Cloud, l'authentification et l'accès aux données.
* **Dossier cible :** `src/services/`
* **Travail à fournir :** Initialiser le SDK Firebase. Créer les fonctions d'inscription/connexion avec *Firebase Auth*. Écrire les scripts pour uploader une vidéo locale vers *Firebase Storage*, récupérer son URL, puis enregistrer le document final dans *Cloud Firestore* (dans la collection `posts`).
* **Exporte :** `authService` (`login`, `register`), `videoService` (`uploadVideo`, `fetchFeedVideos`).

### 💬 4. socialEngagement

* **Rôle :** Gérer le profil utilisateur et les interactions sur les vidéos.
* **Dossier cible :** `src/screens/Profile/` et `src/components/Social/`
* **Travail à fournir :** Créer l'overlay vertical superposé à droite de la vidéo (bouton Like cœur, bouton Commentaire, rotation du disque). Créer l'écran de profil avec les statistiques (abonnés, abonnements) et la grille affichant les miniatures des vidéos de l'utilisateur. Écrire la logique d'incrémentation en temps réel des likes sur Firestore.
* **Exporte :** `ProfileScreen`, `OverlayActions`, `CommentSectionModal`.

### 🔗 5. integration (Lead)

* **Rôle :** Assembler les briques dans le fichier racine `App.js` / `App.tsx`.
* **Travail à fournir :** Connecter les services Firebase de manière globale, encapsuler l'application dans le navigateur principal, et s'assurer que les interactions du module *socialEngagement* se lient correctement sur les vidéos du module *videoEngine*.

---

## 🌿 Branches Git Associées

Pour éviter d'écraser le code des autres, chacun travaille sur sa branche et crée une **Pull Request (PR)** sur GitHub pour fusionner son code sur `main`.

| Module | Branche Git | Responsable |
| --- | --- | --- |
| **navigationUI** | `feature/navigation-ui` | *À attribuer* |
| **videoEngine** | `feature/video-engine` | *À attribuer* |
| **firebaseBackend** | `feature/firebase-backend` | *À attribuer* |
| **socialEngagement** | `feature/social-engagement` | *À attribuer* |
| **integration** | `feature/integration` | **Lead** |

```bash
# Pour commencer à travailler, crée et bascule sur ta branche :
git checkout -b feature/nom-de-ton-module

```

---

## 🧪 Comment tester son module sans attendre les autres ? (Mocks)

Puisque nous apprenons, il ne faut pas attendre que le module Firebase soit fini pour tester l'affichage des vidéos ou du profil. **Créez des données fictives (Mocks)**.

### Exemple pour le module `videoEngine` :

Si tu as besoin de tester ton lecteur vidéo mais que la base de données Firebase n'est pas encore prête, crée un fichier temporaire `src/services/__mocks__/mockVideoService.ts` :

```typescript
export const getMockVideos = () => [
  {
    id: "1",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", // Vidéo de test publique
    description: "Premier test du flux TikTok ! #reactnative",
    likesCount: 120,
    commentsCount: 5,
    userId: "user_01"
  },
  {
    id: "2",
    videoUrl: "https://www.w3schools.com/html/movie.mp4",
    description: "Ça scroll super de haut en bas ! 🔥",
    likesCount: 450,
    commentsCount: 42,
    userId: "user_02"
  }
];

```

Utilise ces données pour parfaire ton interface. Une fois que le module Firebase est validé, il suffira de remplacer `getMockVideos()` par le vrai appel Firebase `fetchFeedVideos()`.

---

## 🧪 Tests Unitaires Automatisés

Chaque fonction logique importante (comme le formatage des nombres ou la validation d'un email) doit posséder son test unitaire. Nous utilisons **Jest**.

Pour lancer la suite de tests automatisés :

```bash
npm test

```

*Règle : Si un test passe au rouge (échec), il est strictement interdit de fusionner la branche sur `main`.*

---

## 🔧 Dépendances Principales Requises

Voici la liste des packages requis. Ils seront installés au fur et à mesure par les responsables des modules :

* **Navigation :** `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`
* **Lecteur Vidéo :** `react-native-video`
* **Liste Haute Performance :** `@shopify/flash-list`
* **Firebase :** `@react-native-firebase/app`, `/auth`, `/firestore`, `/storage`
* **Icônes :** `react-native-vector-icons`

---

## ⚠️ Les 4 Règles d'Or du Projet

1. **Chacun chez soi :** Ne modifie jamais un fichier situé dans le dossier du module d'un camarade sans son accord écrit sur Notion/Discord.
2. **Pas de push direct sur main :** La branche `main` doit toujours rester propre et fonctionnelle. On passe obligatoirement par une *Pull Request* approuvée par au moins un autre membre.
3. **Le contrat est sacré :** Toute modification de la structure des données dans `src/shared/contracts.ts` doit être votée et validée par l'ensemble des 4 membres.
4. **Test sur appareil réel :** Le module vidéo manipulant de gros volumes de données, teste régulièrement sur un vrai téléphone pour surveiller la fluidité et la surchauffe.
>>>>>>> 4023b9b7709cd9d1abb5bc7bfe4b90eb4e6106d2

cool