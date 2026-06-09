import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { authService } from '../services/authService';
import { User } from '../shared/contracts';
import { logger } from '../utils/logger';

/** Résultat standard d'une action d'authentification. */
export interface AuthActionResult {
  success: boolean;
  error?: string;
}

export interface AuthContextValue {
  /** Utilisateur Firebase courant (ou `null` si déconnecté). */
  user: FirebaseAuthTypes.User | null;
  /** Profil applicatif Firestore du compte courant. */
  profile: User | null;
  /** `true` tant que l'état d'auth initial n'est pas connu (splash). */
  initializing: boolean;
  /** `true` pendant une action login/register/logout en cours. */
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  register: (
    email: string,
    password: string,
    username: string,
  ) => Promise<AuthActionResult>;
  logout: () => Promise<AuthActionResult>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // Source de vérité : on écoute l'état d'auth Firebase en continu.
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(nextUser => {
      setUser(nextUser);
      setInitializing(prev => (prev ? false : prev));
    });
    return subscriber;
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!user?.uid) {
      setProfile(null);
      return () => {
        isMounted = false;
      };
    }

    authService.getUserProfile(user.uid).then(nextProfile => {
      if (isMounted) {
        setProfile(nextProfile);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      setLoading(true);
      try {
        const result = await authService.login(email, password);
        return { success: result.success, error: result.error };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      username: string,
    ): Promise<AuthActionResult> => {
      setLoading(true);
      try {
        const result = await authService.register(email, password, username);
        return { success: result.success, error: result.error };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<AuthActionResult> => {
    setLoading(true);
    try {
      const result = await authService.logout();
      return { success: result.success, error: result.error };
    } catch (error) {
      logger.error('Erreur logout :', error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, initializing, loading, login, register, logout }),
    [user, profile, initializing, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
