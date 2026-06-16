/* eslint-env jest */
/* global jest */

// Mocks globaux des modules natifs / navigation pour permettre le rendu des
// composants en environnement Jest (pas de natif disponible).

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Passthrough = ({ children }) => React.createElement(View, null, children);
  return { GestureHandlerRootView: Passthrough };
});

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Passthrough = ({ children }) => React.createElement(View, null, children);
  return {
    SafeAreaProvider: Passthrough,
    SafeAreaView: Passthrough,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('react-native-video', () => 'Video');

jest.mock('react-native-vision-camera', () => ({
  Camera: 'Camera',
  useCameraDevice: () => null,
}));

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    NavigationContainer: ({ children }) => React.createElement(React.Fragment, null, children),
    useIsFocused: () => true,
  };
});

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: () => null,
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: () => null,
  }),
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

jest.mock('react-native-document-picker', () => ({
  pick: jest.fn(),
  pickSingle: jest.fn(),
  types: {
    audio: 'audio',
    images: 'images',
    video: 'video',
    allFiles: 'allFiles',
  },
}));

