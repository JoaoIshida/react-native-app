import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        Alert.alert('Error', 'Failed to sign out. Please try again.');
      }
      // No need to navigate - the auth context will handle that
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'An unexpected error occurred while signing out.');
    }
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading user profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{user.email ? user.email[0].toUpperCase() : '?'}</Text>
          </View>
          <Text style={styles.userName}>{user.email ? user.email.split('@')[0] : 'User'}</Text>
          <Text style={styles.userEmail}>{user.email || 'No email available'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              // Navigate to edit profile screen if you have one
              // router.push('/settings/edit-profile');
              Alert.alert('Info', 'Edit profile screen would open here.');
            }}
          >
            <Ionicons name="person-outline" size={24} color="#333" />
            <Text style={styles.menuItemText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              // Navigate to settings screen if you have one
              // router.push('/settings');
              Alert.alert('Info', 'Settings screen would open here.');
            }}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
            <Text style={styles.menuItemText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemDanger]}
            onPress={() => {
              Alert.alert(
                'Sign Out',
                'Are you sure you want to sign out?',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: handleSignOut,
                  },
                ]
              );
            }}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={styles.menuItemTextDanger}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Info</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              // Open help screen
              Alert.alert('Info', 'Help screen would open here.');
            }}
          >
            <Ionicons name="help-circle-outline" size={24} color="#333" />
            <Text style={styles.menuItemText}>Help</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              // Open about screen
              Alert.alert('Info', 'About screen would open here.');
            }}
          >
            <Ionicons name="information-circle-outline" size={24} color="#333" />
            <Text style={styles.menuItemText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 34,
    color: '#fff',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 16,
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  menuItemTextDanger: {
    flex: 1,
    fontSize: 16,
    marginLeft: 16,
    color: '#FF3B30',
  },
});