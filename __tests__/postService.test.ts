/**
 * Tests du postService : toggleLike (+1/-1, erreurs), createPost, getFeed.
 */
import firestore from '@react-native-firebase/firestore';
import { storageService } from '../src/services/storageService';
import { postService } from '../src/services/postService';

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../src/services/storageService', () => ({
  storageService: {
    uploadVideo: jest.fn(),
    uploadAvatar: jest.fn(),
  },
}));

const mockFirestore = firestore as unknown as jest.Mock;
const mockUploadVideo = storageService.uploadVideo as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('postService.toggleLike', () => {
  const buildFirestore = (transaction: any) => {
    const likeRef = { ref: 'like' };
    const postRef = {
      ref: 'post',
      collection: () => ({ doc: () => likeRef }),
    };
    mockFirestore.mockReturnValue({
      collection: () => ({ doc: () => postRef }),
      runTransaction: (cb: any) => cb(transaction),
    });
    return { likeRef, postRef };
  };

  it('renvoie { success: true, liked: true } et incrémente sur un nouveau like', async () => {
    const tx = {
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    tx.get
      .mockResolvedValueOnce({ exists: () => false }) // likeDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ likesCount: 5 }),
      }); // postDoc
    const { postRef } = buildFirestore(tx);

    const result = await postService.toggleLike('post1', 'user1');

    expect(result).toEqual({ success: true, liked: true });
    expect(tx.set).toHaveBeenCalledTimes(1);
    expect(tx.update).toHaveBeenCalledWith(postRef, { likesCount: 6 });
  });

  it('renvoie { success: true, liked: false } et décrémente sur un unlike', async () => {
    const tx = {
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    tx.get
      .mockResolvedValueOnce({ exists: () => true }) // likeDoc déjà présent
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ likesCount: 3 }),
      });
    const { postRef } = buildFirestore(tx);

    const result = await postService.toggleLike('post1', 'user1');

    expect(result).toEqual({ success: true, liked: false });
    expect(tx.delete).toHaveBeenCalledTimes(1);
    expect(tx.update).toHaveBeenCalledWith(postRef, { likesCount: 2 });
  });

  it('ne descend jamais en dessous de 0 likes', async () => {
    const tx = {
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    tx.get.mockResolvedValueOnce({ exists: () => true }).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ likesCount: 0 }),
    });
    const { postRef } = buildFirestore(tx);

    await postService.toggleLike('post1', 'user1');

    expect(tx.update).toHaveBeenCalledWith(postRef, { likesCount: 0 });
  });

  it("renvoie { success: false, liked: false } si le post n'existe plus", async () => {
    const tx = {
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    tx.get
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({ exists: () => false });
    buildFirestore(tx);

    const result = await postService.toggleLike('post1', 'user1');

    expect(result).toEqual({ success: false, liked: false });
  });
});

describe('postService.createPost', () => {
  it('upload la vidéo puis écrit le document Firestore (succès)', async () => {
    const set = jest.fn().mockResolvedValue(undefined);
    const postRef = { id: 'newPost', set };
    mockFirestore.mockReturnValue({
      collection: () => ({ doc: () => postRef }),
    });
    mockUploadVideo.mockResolvedValue('https://cloud/video.mp4');

    const result = await postService.createPost({
      userId: 'user1',
      videoLocalPath: '/tmp/v.mp4',
      title: '  Titre  ',
      description: '  Hello  ',
    });

    expect(mockUploadVideo).toHaveBeenCalledWith('newPost', '/tmp/v.mp4');
    expect(set).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.post).toMatchObject({
      id: 'newPost',
      userId: 'user1',
      videoUrl: 'https://cloud/video.mp4',
      title: 'Titre',
      description: 'Hello',
      likesCount: 0,
      commentsCount: 0,
    });
  });

  it("échoue proprement si l'upload renvoie null", async () => {
    const set = jest.fn();
    const postRef = { id: 'newPost', set };
    mockFirestore.mockReturnValue({
      collection: () => ({ doc: () => postRef }),
    });
    mockUploadVideo.mockResolvedValue(null);

    const result = await postService.createPost({
      userId: 'user1',
      videoLocalPath: '/tmp/v.mp4',
      description: 'Hello',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(set).not.toHaveBeenCalled();
  });
});

describe('postService.getFeed', () => {
  it('mappe les documents Firestore en Post[]', async () => {
    const docs = [
      {
        id: '1',
        data: () => ({
          userId: 'u1',
          videoUrl: 'x',
          description: 'd',
          likesCount: 1,
          commentsCount: 0,
          createdAt: 1,
        }),
      },
    ];
    mockFirestore.mockReturnValue({
      collection: () => ({
        orderBy: () => ({
          limit: () => ({ get: () => Promise.resolve({ docs }) }),
        }),
      }),
    });

    const feed = await postService.getFeed();

    expect(feed).toHaveLength(1);
    expect(feed[0]).toMatchObject({ id: '1', userId: 'u1' });
  });

  it('propage les erreurs au lieu de les avaler', async () => {
    mockFirestore.mockReturnValue({
      collection: () => ({
        orderBy: () => ({
          limit: () => ({ get: () => Promise.reject(new Error('boom')) }),
        }),
      }),
    });

    await expect(postService.getFeed()).rejects.toThrow('boom');
  });
});

describe('postService.addComment', () => {
  it('écrit le commentaire et incrémente commentsCount', async () => {
    const tx = {
      get: jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ commentsCount: 2 }),
      }),
      set: jest.fn(),
      update: jest.fn(),
    };
    const commentRef = { ref: 'comment' };
    const postRef = {
      ref: 'post',
      collection: () => ({ doc: () => commentRef }),
    };
    mockFirestore.mockReturnValue({
      collection: () => ({ doc: () => postRef }),
      runTransaction: (cb: any) => cb(tx),
    });

    const result = await postService.addComment(
      'post1',
      'user1',
      'alice',
      '  Salut  ',
    );

    expect(result).toBe(true);
    expect(tx.set).toHaveBeenCalledWith(
      commentRef,
      expect.objectContaining({
        userId: 'user1',
        username: 'alice',
        text: 'Salut',
      }),
    );
    expect(tx.update).toHaveBeenCalledWith(postRef, { commentsCount: 3 });
  });
});
