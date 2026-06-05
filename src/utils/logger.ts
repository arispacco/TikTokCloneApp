/**
 * Logger centralisé.
 *
 * Sert de point unique pour la journalisation applicative afin de remplacer
 * les `console.*` épars. En développement, on délègue à la console ; en
 * production, on coupe les logs verbeux (`debug`/`info`) et on conserve les
 * erreurs (qui pourront plus tard être branchées sur Crashlytics/Sentry).
 */

type LogArgs = unknown[];

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

export const logger = {
  debug: (...args: LogArgs): void => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },

  info: (...args: LogArgs): void => {
    if (isDev) {
      console.info('[INFO]', ...args);
    }
  },

  warn: (...args: LogArgs): void => {
    console.warn('[WARN]', ...args);
  },

  error: (...args: LogArgs): void => {
    console.error('[ERROR]', ...args);
  },
};

/**
 * Extrait un message lisible d'une erreur de type `unknown`.
 * Gère les `Error`, les FirebaseError (qui exposent `message`/`code`) et
 * les valeurs arbitraires.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Une erreur inattendue est survenue.';
}
