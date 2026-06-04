/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';
import { authService } from './src/services/authService';

function App(): React.JSX.Element {
  useEffect(() => {
    // Test rapide d'inscription automatique au lancement
    const testAuth = async () => {
      const result = await authService.register(
        "test@tiktokclone.com", 
        "Password123!", 
        "aristide_test"
      );
      console.log("Résultat du test Firebase Auth:", result);
    };

    testAuth();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>TikTok Backend Firebase Initialisé !</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#010101', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#ffffff', fontSize: 18 }
});

export default App;