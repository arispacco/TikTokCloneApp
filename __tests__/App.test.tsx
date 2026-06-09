/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// Firebase est mocké : onAuthStateChanged n'appelle pas le callback, l'app
// reste donc sur l'écran de chargement (splash) — suffisant pour vérifier
// que l'arbre racine se monte sans crash.
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    onAuthStateChanged: () => jest.fn(),
    currentUser: null,
  }),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: () => ({}),
}));

jest.mock('@react-native-firebase/storage', () => ({
  __esModule: true,
  default: () => ({}),
}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
