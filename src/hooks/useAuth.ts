import { useContext } from 'react';
import { AuthContext, AuthContextValue } from '../contexts/AuthProvider';

/**
 * Accès à l'état et aux actions d'authentification.
 * Doit être utilisé à l'intérieur d'un `<AuthProvider>`.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un <AuthProvider>");
  }
  return context;
}
