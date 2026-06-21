import { useEffect, useState, useCallback } from 'react';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { useAuth } from './useAuth';

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: number;
}

export function useLiveChat(liveId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!liveId) return;

    const unsubscribe = firestore()
      .collection('lives')
      .doc(liveId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot) return;
          const newMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as ChatMessage));
          setMessages(newMessages);
        },
        (error) => {
          console.error('Error listening to live chat', error);
        }
      );

    return () => unsubscribe();
  }, [liveId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!user || !text.trim() || !liveId) return;

    try {
      await firestore()
        .collection('lives')
        .doc(liveId)
        .collection('messages')
        .add({
          userId: user.uid,
          username: user.displayName || 'User',
          text: text.trim(),
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (e) {
      console.error('Error sending message', e);
    }
  }, [user, liveId]);

  return { messages, sendMessage };
}
