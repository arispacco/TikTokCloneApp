import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import AuthStack from './AuthStack';
import AppStack from './AppStack';

/**
 * Garde de route racine : tant que l'état d'auth initial est inconnu on
 * affiche un splash ; ensuite on bascule entre la pile d'auth (déconnecté)
 * et les onglets principaux (connecté).
 */
export default function RootNavigator(): React.JSX.Element {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#ff0050" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});
