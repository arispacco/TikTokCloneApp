import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import {
  Home,
  MessageCircle,
  Plus,
  User,
  Users,
} from 'lucide-react-native';
import FeedScreen from '../screens/FeedScreen';
import CameraScreen from '../screens/CameraScreen';
import FriendsScreen from '../screens/FriendsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { MainTabsParamList } from './types';

const Tab = createBottomTabNavigator<MainTabsParamList>();

// Composants d'icônes définis hors du render pour éviter le warning ESLint
// `no-unstable-nested-components` (recréation d'un composant à chaque rendu).
function HomeTabIcon({ color }: { color: string }): React.JSX.Element {
  return <Home color={color} size={28} strokeWidth={2.5} />;
}

function FriendsTabIcon({ color }: { color: string }): React.JSX.Element {
  return <Users color={color} size={29} strokeWidth={2.5} />;
}

function CreateTabIcon(): React.JSX.Element {
  return (
    <View style={styles.createButtonWrap}>
      <View style={styles.createCyanShadow} />
      <View style={styles.createPinkShadow} />
      <View style={styles.createButton}>
        <Plus color="#000000" size={30} strokeWidth={3} />
      </View>
    </View>
  );
}

function MessagesTabIcon({ color }: { color: string }): React.JSX.Element {
  return (
    <View>
      <MessageCircle color={color} size={28} strokeWidth={2.5} />
      <View style={styles.messageBadge}>
        <Text style={styles.messageBadgeText}>99+</Text>
      </View>
    </View>
  );
}

function ProfileTabIcon({ color }: { color: string }): React.JSX.Element {
  return <User color={color} size={28} strokeWidth={2.5} />;
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
        name="Friends"
        component={FriendsScreen}
        options={{
          tabBarLabel: 'Ami(e)s',
          tabBarIcon: FriendsTabIcon,
        }}
      />

      <Tab.Screen
        name="Create"
        component={CameraScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: CreateTabIcon,
        }}
      />

      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: MessagesTabIcon,
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ProfileTabIcon,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#171717',
    height: 66,
    paddingBottom: 7,
    paddingTop: 7,
  },
  createButtonWrap: {
    width: 58,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  createButton: {
    width: 50,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  createCyanShadow: {
    position: 'absolute',
    left: 0,
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#25f4ee',
  },
  createPinkShadow: {
    position: 'absolute',
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#ff2d55',
  },
  messageBadge: {
    position: 'absolute',
    right: -18,
    top: -10,
    minWidth: 34,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ff2d55',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  messageBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
