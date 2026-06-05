import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

export default function App(): React.JSX.Element {
  return (
    // SafeAreaProvider protège l'application des encoches (notches) et barres système des téléphones modernes
    <SafeAreaProvider>
      {/* On configure la barre du haut du téléphone en noir transparent */}
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true} />
      
      {/* On lance la navigation globale */}
      <AppNavigator />
    </SafeAreaProvider>
  );
}