import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Send, X } from 'lucide-react-native';
import { postService } from '../services/postService';
import { Comment } from '../shared/contracts';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../utils/logger';

interface CommentSectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  postId: string;
  onCommentAdded?: () => void;
}

export default function CommentSectionModal({
  isVisible,
  onClose,
  postId,
  onCommentAdded,
}: CommentSectionModalProps): React.JSX.Element {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const fetched = await postService.getComments(postId);
      setComments(fetched);
    } catch (error) {
      logger.error('Erreur fetchComments :', error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (isVisible) {
      fetchComments();
    }
  }, [isVisible, fetchComments]);

  const handleAddComment = async () => {
    if (!user || !newCommentText.trim() || submitting) return;

    setSubmitting(true);
    const username =
      profile?.username ||
      user.displayName ||
      user.email?.split('@')[0] ||
      'utilisateur';

    const success = await postService.addComment(
      postId,
      user.uid,
      username,
      newCommentText,
    );

    if (success) {
      setNewCommentText('');
      fetchComments();
      onCommentAdded?.();
    }
    setSubmitting(false);
  };

  const renderCommentItem = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentAvatar}>
        <Text style={styles.commentAvatarText}>
          {item.username.substring(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={styles.commentContent}>
        <Text style={styles.commentUsername}>{item.username}</Text>
        <Text style={styles.commentText}>{item.text}</Text>
        <Text style={styles.commentDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {comments.length} commentaires
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#333" size={24} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color="#ff2d55" size="large" />
            </View>
          ) : (
            <FlatList
              data={comments}
              renderItem={renderCommentItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.centered}>
                  <Text style={styles.emptyText}>
                    Aucun commentaire pour le moment.
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Soyez le premier à commenter !
                  </Text>
                </View>
              }
            />
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ajouter un commentaire..."
              placeholderTextColor="#888"
              value={newCommentText}
              onChangeText={setNewCommentText}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newCommentText.trim() || submitting) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleAddComment}
              disabled={!newCommentText.trim() || submitting}
            >
              <Send
                color={newCommentText.trim() ? '#ff2d55' : '#ccc'}
                size={22}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    position: 'absolute',
    right: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 15,
    color: '#111',
    lineHeight: 20,
  },
  commentDate: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    color: '#000',
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    padding: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
