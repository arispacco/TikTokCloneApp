import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, SafeAreaView } from 'react-native';
import { createAgoraRtcEngine, IRtcEngine, ChannelProfileType, ClientRoleType, RtcSurfaceView } from 'react-native-agora';
import { useNavigation } from '@react-navigation/native';
import { useLiveChat } from '../hooks/useLiveChat';
import { useLivePresence } from '../hooks/useLivePresence';
import { useAuth } from '../hooks/useAuth';
import firestore from '@react-native-firebase/firestore';
import { X, Send } from 'lucide-react-native';

const AGORA_APP_ID = '3fb0cb086e274e43981b76cf7fec6783';

export default function LiveBroadcastScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const { user } = useAuth();
  const engine = useRef<IRtcEngine | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [liveId] = useState(`live_${user?.uid}_${Date.now()}`);
  const [chatMessage, setChatMessage] = useState('');

  const { messages, sendMessage } = useLiveChat(liveId);
  const { viewersCount } = useLivePresence(liveId, true);

  useEffect(() => {
    initEngine();
    return () => {
      endLive();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initEngine = async () => {
    try {
      engine.current = createAgoraRtcEngine();
      engine.current.initialize({
        appId: AGORA_APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });
      engine.current.enableVideo();
      engine.current.startPreview();
      engine.current.joinChannel('', liveId, 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });

      engine.current.addListener('onJoinChannelSuccess', () => {
        setIsJoined(true);
        if (user) {
          firestore().collection('lives').doc(liveId).set({
            broadcasterId: user.uid,
            broadcasterName: user.displayName || 'Utilisateur',
            status: 'live',
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
        }
      });
    } catch (e) {
      console.log('Agora Engine Error', e);
    }
  };

  const endLive = () => {
    if (engine.current) {
      engine.current.leaveChannel();
      engine.current.release();
    }
    firestore().collection('lives').doc(liveId).update({
      status: 'ended',
      endedAt: firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});
  };

  const handleSend = () => {
    if (chatMessage.trim()) {
      sendMessage(chatMessage);
      setChatMessage('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isJoined && (
        <RtcSurfaceView canvas={{ uid: 0 }} style={StyleSheet.absoluteFill} />
      )}
      
      <View style={styles.header}>
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <View style={styles.viewersBadge}>
          <Text style={styles.viewersText}>👁 {viewersCount}</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <X color="white" size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.chatContainer}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          inverted
          renderItem={({ item }) => (
            <View style={styles.messageRow}>
              <Text style={styles.messageUser}>{item.username}: </Text>
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          )}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Commenter..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={chatMessage}
            onChangeText={setChatMessage}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity onPress={handleSend}>
            <Send color="white" size={24} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, zIndex: 10 },
  liveBadge: { backgroundColor: 'red', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, marginRight: 10 },
  liveText: { color: 'white', fontWeight: 'bold' },
  viewersBadge: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  viewersText: { color: 'white' },
  closeButton: { marginLeft: 'auto', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 4 },
  chatContainer: { flex: 1, justifyContent: 'flex-end', padding: 16, zIndex: 10, paddingBottom: 20 },
  messageRow: { flexDirection: 'row', marginBottom: 8, backgroundColor: 'rgba(0,0,0,0.4)', alignSelf: 'flex-start', padding: 8, borderRadius: 8 },
  messageUser: { color: '#ff2d55', fontWeight: 'bold' },
  messageText: { color: 'white' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  input: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', padding: 12, borderRadius: 20, marginRight: 10 },
});
