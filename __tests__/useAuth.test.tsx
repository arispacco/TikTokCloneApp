/**
 * Tests du AuthProvider + hook useAuth (états initializing/user/loading,
 * délégation à authService, garde hors provider).
 */
import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import auth from '@react-native-firebase/auth';
import { AuthProvider, AuthContextValue } from '../src/contexts/AuthProvider';
import { useAuth } from '../src/hooks/useAuth';
import { authService } from '../src/services/authService';

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../src/services/authService', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));

const mockAuth = auth as unknown as jest.Mock;

let authCallback: ((user: unknown) => void) | undefined;

beforeEach(() => {
  jest.clearAllMocks();
  authCallback = undefined;
  mockAuth.mockReturnValue({
    onAuthStateChanged: (cb: (user: unknown) => void) => {
      authCallback = cb;
      return jest.fn(); // unsubscribe
    },
  });
});

function renderWithProvider() {
  let captured: AuthContextValue | undefined;
  const Consumer = () => {
    captured = useAuth();
    return null;
  };
  let tree: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    tree = ReactTestRenderer.create(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
  });
  return {
    get value() {
      return captured as AuthContextValue;
    },
    unmount: () => act(() => tree.unmount()),
  };
}

describe('AuthProvider / useAuth', () => {
  it('démarre en initializing=true puis passe à false après onAuthStateChanged', () => {
    const handle = renderWithProvider();

    expect(handle.value.initializing).toBe(true);
    expect(handle.value.user).toBeNull();

    act(() => {
      authCallback?.(null);
    });

    expect(handle.value.initializing).toBe(false);
    expect(handle.value.user).toBeNull();
    handle.unmount();
  });

  it('expose l\'utilisateur connecté quand onAuthStateChanged renvoie un user', () => {
    const handle = renderWithProvider();

    act(() => {
      authCallback?.({ uid: 'uid1' });
    });

    expect(handle.value.user).toEqual({ uid: 'uid1' });
    expect(handle.value.initializing).toBe(false);
    handle.unmount();
  });

  it('délègue login() à authService et renvoie le résultat', async () => {
    (authService.login as jest.Mock).mockResolvedValue({ success: true });
    const handle = renderWithProvider();

    let result: { success: boolean } | undefined;
    await act(async () => {
      result = await handle.value.login('a@b.com', 'secret');
    });

    expect(authService.login).toHaveBeenCalledWith('a@b.com', 'secret');
    expect(result?.success).toBe(true);
    handle.unmount();
  });

  it('useAuth lève une erreur hors d\'un AuthProvider', () => {
    const Orphan = () => {
      useAuth();
      return null;
    };
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      act(() => {
        ReactTestRenderer.create(<Orphan />);
      });
    }).toThrow(/AuthProvider/);
    spy.mockRestore();
  });
});
