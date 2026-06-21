import { useEffect, useState } from 'react';
import database from '@react-native-firebase/database';
import { useAuth } from './useAuth';

export function useLivePresence(liveId: string, isBroadcaster: boolean = false) {
  const [viewersCount, setViewersCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!liveId || !user) return;

    const viewersRef = database().ref(`/lives/${liveId}/viewers`);
    const myViewerRef = viewersRef.child(user.uid);

    // Si on n'est pas le streamer, on s'ajoute comme spectateur
    if (!isBroadcaster) {
      myViewerRef.set(true).then(() => {
        // En cas de déconnexion, supprimer ma présence
        myViewerRef.onDisconnect().remove();
      });
    }

    // Écouter le nombre total de spectateurs
    const onValueChange = viewersRef.on('value', snapshot => {
      if (snapshot.exists()) {
        setViewersCount(snapshot.numChildren());
      } else {
        setViewersCount(0);
      }
    });

    return () => {
      viewersRef.off('value', onValueChange);
      if (!isBroadcaster) {
        myViewerRef.remove();
        myViewerRef.onDisconnect().cancel();
      }
    };
  }, [liveId, user, isBroadcaster]);

  return { viewersCount };
}
