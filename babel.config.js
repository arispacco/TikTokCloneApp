import React, { useState } from 'react';
import { SafeAreaView, Text, Button, ScrollView, View, StyleSheet } from 'react-native';
import { authService } from './src/services/authService';
import { postService } from './src/services/postService';

export default function App(): React.JSX.Element {
  // On crée un écran de logs comme dans un vrai terminal
  const [logs, setLogs] = useState<string>('>>> Initialisation des tests...\n');

  const addLog = (msg: string) => {
    setLogs(prev => prev + msg + '\n');
  };

  // 1. Test de Création de compte
  const testRegister = async () => {
    addLog('⏳ Inscription de Aristide...');
    const result = await authService.register("lead@tiktokclone.com", "Azerty123!", "aristide_lead");
    if (result.success) {
      addLog('✅ Utilisateur créé avec UID : ' + result.user?.uid);
    } else {
      addLog('❌ Erreur Inscription : ' + result.error);
    }
  };

  // 2. Test de Lecture de la Base de données
  const testFeed = async () => {
    addLog('⏳ Récupération des vidéos...');
    const feed = await postService.getFeed();
    addLog(`✅ Firestore OK ! Vidéos trouvées : ${feed.length}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🧪 Laboratoire Backend</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="1. Créer un compte Test" onPress={testRegister} color="#ff0050" />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button title="2. Lire la base de données" onPress={testFeed} color="#00f2fe" />
      </View>

      <ScrollView style={styles.console}>
        <Text style={styles.consoleText}>{logs}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#010101', padding: 20 },
  title: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  buttonContainer: { marginBottom: 15 },
  console: { backgroundColor: '#1a1a1a', padding: 10, borderRadius: 8, marginTop: 20 },
  consoleText: { color: '#00ff00', fontFamily: 'monospace', fontSize: 14 }
});