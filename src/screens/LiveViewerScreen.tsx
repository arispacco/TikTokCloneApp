import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, SafeAreaView } from 'react-native';
import { createAgoraRtcEngine, IRtcEngine, ChannelProfileType, ClientRoleType, RtcSurfaceView } from 'react-native-agora';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useLiveChat } from '../hooks/useLiveChat';
import { useLivePresence } from '../hooks/useLivePresence';
import { X, Send, Heart } from 'lucide-react-native';

const AGORA_APP_ID = '3fb0cb086e274e43981b76cf7fec6783';

type LiveViewerRouteProp = RouteProp<RootStackParamList, 'LiveViewer'>;

export default function LiveViewerScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const route = useRoute<LiveViewerRouteProp>();
  const { liveId, broadcasterName } = route.params;
  
  const engine = useRef<IRtcEngine | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number>(0);
  const [chatMessage, setChatMessage] = useState('');

  const { messages, sendMessage } = useLiveChat(liveId);
  const { viewersCount } = useLivePresence(liveId, false);

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
      engine.current.joinChannel('', liveId, 0, {
        clientRoleType: ClientRoleType.ClientRoleAudience,
      });

      engine.current.addListener('onJoinChannelSuccess', () => {
        setIsJoined(true);
      });

      engine.current.addListener('onUserJoined', (_connection, uid) => {
        setRemoteUid(uid);
      });

      engine.current.addListener('onUserOffline', (_connection, uid) => {
        if (uid === remoteUid) {
          setRemoteUid(0);
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
  };

  const handleSend = () => {
    if (chatMessage.trim()) {
      sendMessage(chatMessage);
      setChatMessage('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isJoined && remoteUid !== 0 ? (
        <RtcSurfaceView canvas={{ uid: remoteUid }} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>En attente du flux vidéo...</Text>
        </View>
      )}
      
      <View style={styles.header}>
        <View style={styles.broadcasterBadge}>
          <Text style={styles.broadcasterText}>{broadcasterName}</Text>
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
        <View style={styles.actionRow}>
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
          <TouchableOpacity style={styles.likeButton}>
            <Heart color="red" fill="red" size={28} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'white' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, zIndex: 10 },
  broadcasterBadge: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 10 },
  broadcasterText: { color: 'white', fontWeight: 'bold' },
  viewersBadge: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  viewersText: { color: 'white' },
  closeButton: { marginLeft: 'auto', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 4 },
  chatContainer: { flex: 1, justifyContent: 'flex-end', padding: 16, zIndex: 10, paddingBottom: 20 },
  messageRow: { flexDirection: 'row', marginBottom: 8, backgroundColor: 'rgba(0,0,0,0.4)', alignSelf: 'flex-start', padding: 8, borderRadius: 8 },
  messageUser: { color: '#ff2d55', fontWeight: 'bold' },
  messageText: { color: 'white' },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  inputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 20, marginRight: 10 },
  input: { flex: 1, color: 'white', marginRight: 10, padding: 0 },
  likeButton: { padding: 8 },
});
