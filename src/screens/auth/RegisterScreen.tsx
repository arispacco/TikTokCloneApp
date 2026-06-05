import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({
  navigation,
}: Props): React.JSX.Element {
  const { register, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setError(null);
    if (!username.trim() || !email.trim() || !password) {
      setError('Tous les champs sont obligatoires.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    const result = await register(email, password, username);
    if (!result.success) {
      setError(result.error ?? 'Inscription impossible. Réessaie.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Créer un compte</Text>
      <Text style={styles.subtitle}>Rejoins la communauté 🎬</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom d'utilisateur"
        placeholderTextColor="#888"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        editable={!loading}
        accessibilityLabel="Champ nom d'utilisateur"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
        accessibilityLabel="Champ email"
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe (6 caractères min.)"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!loading}
        accessibilityLabel="Champ mot de passe"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Créer mon compte"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>S'inscrire</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate('Login')}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Aller à la connexion"
      >
        <Text style={styles.linkText}>
          Déjà un compte ? <Text style={styles.linkAccent}>Connecte-toi</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 24,
    justifyContent: 'center',
  },
  title: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#aaa', fontSize: 16, marginBottom: 32 },
  input: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    fontSize: 16,
  },
  error: { color: '#ff5a5a', marginBottom: 14 },
  button: {
    backgroundColor: '#ff0050',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkButton: { marginTop: 22, alignItems: 'center' },
  linkText: { color: '#aaa', fontSize: 14 },
  linkAccent: { color: '#ff0050', fontWeight: 'bold' },
});
