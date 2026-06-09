/**
 * Tests du authService : register / login / logout (succès et erreurs).
 */
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { authService } from '../src/services/authService';

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockAuth = auth as unknown as jest.Mock;
const mockFirestore = firestore as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('authService.register', () => {
  it('crée le compte Auth puis le profil Firestore (succès)', async () => {
    const updateProfile = jest.fn().mockResolvedValue(undefined);
    const createUser = jest
      .fn()
      .mockResolvedValue({ user: { uid: 'uid1', updateProfile } });
    mockAuth.mockReturnValue({ createUserWithEmailAndPassword: createUser });

    const set = jest.fn().mockResolvedValue(undefined);
    mockFirestore.mockReturnValue({
      collection: () => ({ doc: () => ({ set }) }),
    });

    const result = await authService.register('a@b.com', 'secret', 'Alice');

    expect(createUser).toHaveBeenCalledWith('a@b.com', 'secret');
    expect(updateProfile).toHaveBeenCalledWith({ displayName: 'alice' });
    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'uid1',
        email: 'a@b.com',
        username: 'alice',
      }),
    );
    expect(result.success).toBe(true);
    expect(result.user?.uid).toBe('uid1');
  });

  it('renvoie success=false + message si Auth échoue', async () => {
    mockAuth.mockReturnValue({
      createUserWithEmailAndPassword: jest
        .fn()
        .mockRejectedValue(new Error('email-already-in-use')),
    });

    const result = await authService.register('a@b.com', 'secret', 'Alice');

    expect(result.success).toBe(false);
    expect(result.error).toBe('email-already-in-use');
  });
});

describe('authService.login', () => {
  it('connecte un utilisateur existant (succès)', async () => {
    mockAuth.mockReturnValue({
      signInWithEmailAndPassword: jest
        .fn()
        .mockResolvedValue({ user: { uid: 'uid1' } }),
    });

    const result = await authService.login('a@b.com', 'secret');

    expect(result.success).toBe(true);
    expect(result.user?.uid).toBe('uid1');
  });

  it('renvoie success=false + message si la connexion échoue', async () => {
    mockAuth.mockReturnValue({
      signInWithEmailAndPassword: jest
        .fn()
        .mockRejectedValue(new Error('wrong-password')),
    });

    const result = await authService.login('a@b.com', 'bad');

    expect(result.success).toBe(false);
    expect(result.error).toBe('wrong-password');
  });
});

describe('authService.logout', () => {
  it("déconnecte l'utilisateur (succès)", async () => {
    const signOut = jest.fn().mockResolvedValue(undefined);
    mockAuth.mockReturnValue({ signOut });

    const result = await authService.logout();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });
});

describe('authService.getUserProfile', () => {
  it('renvoie le profil Firestore si le document existe', async () => {
    const data = jest.fn(() => ({ uid: 'uid1', username: 'alice' }));
    const get = jest.fn().mockResolvedValue({ exists: () => true, data });
    mockFirestore.mockReturnValue({
      collection: () => ({ doc: () => ({ get }) }),
    });

    const profile = await authService.getUserProfile('uid1');

    expect(profile).toMatchObject({ uid: 'uid1', username: 'alice' });
  });

  it('renvoie null si le profil Firestore est absent', async () => {
    const get = jest.fn().mockResolvedValue({ exists: () => false });
    mockFirestore.mockReturnValue({
      collection: () => ({ doc: () => ({ get }) }),
    });

    const profile = await authService.getUserProfile('uid1');

    expect(profile).toBeNull();
  });
});
