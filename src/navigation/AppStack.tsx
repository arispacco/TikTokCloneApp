import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import { RootStackParamList } from './types';
import LiveBroadcastScreen from '../screens/LiveBroadcastScreen';
import LiveViewerScreen from '../screens/LiveViewerScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="LiveBroadcast" component={LiveBroadcastScreen} />
      <Stack.Screen name="LiveViewer" component={LiveViewerScreen} />
    </Stack.Navigator>
  );
}
