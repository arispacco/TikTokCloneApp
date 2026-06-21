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

jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(),
  pickDirectory: jest.fn(),
  types: {
    audio: 'audio',
    images: 'images',
    video: 'video',
    allFiles: 'allFiles',
  },
  errorCodes: {
    IN_PROGRESS: 'IN_PROGRESS',
    USER_CANCELED: 'USER_CANCELED',
  },
  isErrorWithCode: jest.fn(),
}));

jest.mock('react-native-agora', () => {
  return {
    createAgoraRtcEngine: jest.fn(() => ({
      initialize: jest.fn(),
      enableVideo: jest.fn(),
      startPreview: jest.fn(),
      joinChannel: jest.fn(),
      leaveChannel: jest.fn(),
      release: jest.fn(),
      addListener: jest.fn(),
    })),
    ChannelProfileType: { ChannelProfileLiveBroadcasting: 0 },
    ClientRoleType: { ClientRoleBroadcaster: 1, ClientRoleAudience: 2 },
    RtcSurfaceView: 'RtcSurfaceView',
  };
});

jest.mock('@react-native-firebase/database', () => {
  return () => ({
    ref: jest.fn(() => ({
      child: jest.fn(() => ({
        onDisconnect: jest.fn(() => ({
          remove: jest.fn(),
          set: jest.fn(),
        })),
        set: jest.fn(),
      })),
      on: jest.fn(),
      off: jest.fn(),
    })),
  });
});
