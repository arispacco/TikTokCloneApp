import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';
import FeedScreen from '../screens/FeedScreen';
import CameraScreen from '../screens/CameraScreen';
import { MainTabsParamList } from './types';

const Tab = createBottomTabNavigator<MainTabsParamList>();

// Composants d'icônes définis hors du render pour éviter le warning ESLint
// `no-unstable-nested-components` (recréation d'un composant à chaque rendu).
function HomeTabIcon({ color }: { color: string }): React.JSX.Element {
  return <Text style={[styles.icon, { color }]}>🏠</Text>;
}

function CreateTabIcon(): React.JSX.Element {
  return <Text style={styles.createButtonIcon}>➕</Text>;
}

export default function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#888888',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={FeedScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: HomeTabIcon,
        }}
      />

      <Tab.Screen
        name="Create"
        component={CameraScreen}
        options={{
          tabBarLabel: 'Créer',
          tabBarIcon: CreateTabIcon,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000000',
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
  },
});
