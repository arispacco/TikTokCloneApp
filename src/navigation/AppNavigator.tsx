import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Text, StyleSheet } from 'react-native';

// Importation de tes écrans
import FeedScreen from '../screens/FeedScreen';
import CameraScreen from '../screens/CameraScreen';

// Initalisation du compagnon de route des onglets
const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: styles.tabBar, // Personnalisation visuelle de la barre
          tabBarActiveTintColor: '#ffffff', // Couleur de l'icône active
          tabBarInactiveTintColor: '#888888', // Couleur de l'icône inactive
          headerShown: false, // Cache la barre de titre d'en haut (le header standard)
        }}
      >
        {/* ONGLET 1 : L'ACCUEIL (LE FEED) */}
        <Tab.Screen 
          name="Home" 
          component={FeedScreen} 
          options={{
            tabBarLabel: 'Accueil',
            tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>🏠</Text>
          }}
        />

        {/* ONGLET 2 : LE BOUTON CENTRAL CRÉATION [+] */}
        <Tab.Screen 
          name="Create" 
          component={CameraScreen} 
          options={{
            tabBarLabel: 'Créer',
            tabBarIcon: () => (
              <Text style={styles.createButtonIcon}>➕</Text>
            )
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000000', // Fond noir style TikTok
    borderTopWidth: 0.5,
    borderTopColor: '#121212',
    height: 60,
    paddingBottom: 5,
  },
  icon: {
    fontSize: 20,
  },
  createButtonIcon: {
    fontSize: 22,
    backgroundColor: '#ffffff',
    color: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
    fontWeight: 'bold',
  }
});