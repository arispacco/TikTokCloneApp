import { NavigatorScreenParams } from '@react-navigation/native';

/** Routes de la pile d'authentification (utilisateur déconnecté). */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

/** Onglets principaux (utilisateur connecté). */
export type MainTabsParamList = {
  Home: undefined;
  Friends: undefined;
  Create: undefined;
  Messages: undefined;
  Profile: { userId?: string } | undefined;
};

/** Pile de navigation globale pour l'utilisateur connecté */
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabsParamList>;
  LiveBroadcast: undefined;
  LiveViewer: { liveId: string; broadcasterName: string };
};
