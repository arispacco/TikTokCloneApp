import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Grid3X3, LogOut, User } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';

export default function ProfileScreen(): React.JSX.Element {
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    const result = await logout();
    if (!result.success) {
      Alert.alert('Deconnexion impossible', result.error ?? 'Reessaie plus tard.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Profil</Text>

      <View style={styles.avatar}>
        <User color="#ffffff" size={54} strokeWidth={2.2} />
      </View>

      <Text style={styles.username}>
        @{user?.displayName ?? user?.email?.split('@')[0] ?? 'utilisateur'}
      </Text>
      <Text style={styles.email}>{user?.email ?? 'Compte connecte'}</Text>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Abonnements</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Abonnes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>J'aime</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.editButton}
        accessibilityRole="button"
        accessibilityLabel="Modifier le profil"
      >
        <Text style={styles.editButtonText}>Modifier le profil</Text>
      </TouchableOpacity>

      <View style={styles.gridHeader}>
        <Grid3X3 color="#ffffff" size={24} strokeWidth={2.4} />
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Aucune publication</Text>
        <Text style={styles.emptyText}>
          Tes videos publiees apparaitront ici.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Se deconnecter"
      >
        <LogOut color="#ffffff" size={20} strokeWidth={2.3} />
        <Text style={styles.logoutText}>
          {loading ? 'Deconnexion...' : 'Se deconnecter'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    paddingTop: 58,
    paddingHorizontal: 24,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 28,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 16,
  },
  email: { color: '#8f8f8f', fontSize: 15, marginTop: 6 },
  stats: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 28,
  },
  statItem: { alignItems: 'center' },
  statValue: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
  statLabel: { color: '#cfcfcf', fontSize: 13, marginTop: 4 },
  editButton: {
    width: '100%',
    height: 46,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2f2f2f',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  editButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  gridHeader: {
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1d1d1d',
    paddingVertical: 18,
    marginTop: 20,
  },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  emptyText: {
    color: '#8f8f8f',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff2d55',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 22,
    marginBottom: 28,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
});
