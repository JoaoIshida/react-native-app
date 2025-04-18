import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/supabase/auth';
import supabase from '@/lib/supabase/createClient';

// Import GoogleSignin conditionally for native platforms
let GoogleSignin = null;
if (Platform.OS !== 'web') {
  try {
    const { GoogleSignin: GS } = require('@react-native-google-signin/google-signin');
    GoogleSignin = GS;
  } catch (error) {
    console.error('Failed to import GoogleSignin:', error);
  }
}

// Custom alert function that works across platforms
const showAlert = (title, message, buttons) => {
  if (Platform.OS === 'web') {
    // For web, use window.confirm or a custom alert implementation
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        // User clicked OK/confirm
        const confirmButton = buttons.find(btn => btn.style === 'destructive' || btn.text === 'OK');
        if (confirmButton && confirmButton.onPress) {
          confirmButton.onPress();
        }
      } else {
        // User clicked Cancel
        const cancelButton = buttons.find(btn => btn.style === 'cancel');
        if (cancelButton && cancelButton.onPress) {
          cancelButton.onPress();
        }
      }
    } else {
      window.alert(`${title}\n\n${message}`);
      if (buttons && buttons.length === 1 && buttons[0].onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    // For native platforms, use React Native's Alert
    Alert.alert(title, message, buttons);
  }
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Get authentication provider
  const authProvider = user?.app_metadata?.provider || 'email';
  const isGoogleAuth = authProvider === 'google';

  const handleSignOut = async () => {
    console.log('Sign out button pressed');

    try {
      setIsSigningOut(true);
      console.log('Signing out user. Auth provider:', authProvider);

      // For native platforms, explicitly sign out from Google if needed
      if (isGoogleAuth && Platform.OS !== 'web' && GoogleSignin) {
        try {
          console.log('Signing out from native Google Sign-In');
          await GoogleSignin.signOut();
        } catch (googleError) {
          console.error('Google Sign-Out error:', googleError);
        }
      }

      // Call Supabase signOut method directly to avoid potential issues with context
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Supabase Sign Out error:', error);
        showAlert('Error', 'Failed to sign out. Please try again.');
        return;
      }

      console.log('Successfully signed out');

      // For web, also clear local storage to ensure all auth state is removed
      if (Platform.OS === 'web') {
        try {
          localStorage.removeItem('supabase.auth.token');
          console.log('Cleared auth tokens from local storage');

          // Force navigation for web
          window.location.href = '/auth/login';
        } catch (e) {
          console.error('Error clearing local storage:', e);
        }
      } else {
        // Force navigation for native platforms
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      showAlert('Error', 'An unexpected error occurred while signing out.');

      // Emergency fallback sign-out
      try {
        await supabase.auth.signOut();
        if (Platform.OS === 'web') {
          window.location.href = '/auth/login';
        } else {
          router.replace('/auth/login');
        }
      } catch (e) {
        console.error('Emergency sign-out failed:', e);
      }
    } finally {
      setIsSigningOut(false);
    }
  };

  // Emergency sign out - completely bypasses normal flow
  const emergencySignOut = () => {
    console.log('Emergency sign out triggered');

    if (Platform.OS === 'web') {
      try {
        localStorage.clear();
        window.location.href = '/auth/login';
      } catch (e) {
        console.error('Web emergency sign out failed:', e);
      }
    } else {
      supabase.auth.signOut()
        .then(() => router.replace('/auth/login'))
        .catch(e => console.error('Native emergency sign out failed:', e));
    }
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 20 }}>Loading user profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          {isGoogleAuth && user.user_metadata?.picture && Platform.OS === 'web' ? (
            <View style={styles.avatarContainer}>
              <img
                src={user.user_metadata.picture}
                style={styles.avatarImage}
                alt="Profile"
                onError={(e) => {
                  // Fallback to text avatar on image load error
                  e.target.style.display = 'none';
                  document.getElementById('textAvatar').style.display = 'flex';
                }}
              />
              <View id="textAvatar" style={[styles.avatarTextContainer, { display: 'none' }]}>
                <Text style={styles.avatarText}>{user.email ? user.email[0].toUpperCase() : '?'}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{user.email ? user.email[0].toUpperCase() : '?'}</Text>
            </View>
          )}

          <Text style={styles.userName}>
            {user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              (user.email ? user.email.split('@')[0] : 'User')}
          </Text>
          <Text style={styles.userEmail}>{user.email || 'No email available'}</Text>

          <View style={styles.authProviderBadge}>
            <Ionicons
              name={isGoogleAuth ? "logo-google" : "mail-outline"}
              size={16}
              color="#fff"
              style={styles.badgeIcon}
            />
            <Text style={styles.badgeText}>
              {isGoogleAuth ? 'Google Account' : 'Email Account'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              showAlert('Info', 'Edit profile screen would open here.');
            }}
          >
            <Ionicons name="person-outline" size={24} color="#333" />
            <Text style={styles.menuItemText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              showAlert('Info', 'Settings screen would open here.');
            }}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
            <Text style={styles.menuItemText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemDanger]}
            disabled={isSigningOut}
            onPress={() => {
              if (Platform.OS === 'web') {
                if (window.confirm('Are you sure you want to sign out?')) {
                  handleSignOut();
                }
              } else {
                showAlert(
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
              }
            }}
          >
            {isSigningOut ? (
              <>
                <ActivityIndicator size="small" color="#FF3B30" style={{ marginRight: 16 }} />
                <Text style={styles.menuItemTextDanger}>Signing Out...</Text>
              </>
            ) : (
              <>
                <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                <Text style={styles.menuItemTextDanger}>Sign Out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Info</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              showAlert('Info', 'Help screen would open here.');
            }}
          >
            <Ionicons name="help-circle-outline" size={24} color="#333" />
            <Text style={styles.menuItemText}>Help</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              showAlert('Info', 'About screen would open here.');
            }}
          >
            <Ionicons name="information-circle-outline" size={24} color="#333" />
            <Text style={styles.menuItemText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemDanger]}
            onPress={emergencySignOut}
          >
            <Ionicons name="alert-circle-outline" size={24} color="#FF3B30" />
            <Text style={styles.menuItemTextDanger}>Emergency Sign Out</Text>
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
    overflow: 'hidden',
  },
  avatarTextContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  avatarText: {
    fontSize: 34,
    color: '#fff',
    fontWeight: 'bold',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  authProviderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  badgeIcon: {
    marginRight: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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