import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, Platform } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/supabase/auth';
import supabase from '@/lib/supabase/createClient';

// Root layout wrapper that handles auth state
export default function RootLayout() {
  return (
    <AuthProvider>
      <SessionHandler />
      <RootLayoutNav />
    </AuthProvider>
  );
}

// Component to handle OAuth redirects and initialize auth
function SessionHandler() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const handleSession = async () => {
      if (Platform.OS === 'web') {
        try {
          // Handle hash parameters for web OAuth
          if (window.location.hash && window.location.hash.includes('access_token')) {
            console.log('Processing OAuth redirect hash params');

            // Extract hash parameters
            const hashParams = window.location.hash.substring(1);
            const params = new URLSearchParams(hashParams);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken) {
              // Set the session manually
              console.log('Setting session with access token from hash');
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });

              // Clean up the URL
              if (window.history && window.history.replaceState) {
                window.history.replaceState(
                  null,
                  document.title,
                  window.location.pathname
                );
              }
            }
          }

          // Ensure session is loaded
          await supabase.auth.getSession();
        } catch (error) {
          console.error('Error handling session:', error);
        }
      }

      // Initialize Google Sign-In for native platforms
      auth.initGoogleSignIn();

      setInitializing(false);
    };

    handleSession();
  }, []);

  // This component doesn't render anything
  return initializing ? (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  ) : null;
}

// Navigation component that renders different layouts based on auth state
function RootLayoutNav() {
  const { authSession, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const isAuthenticated = !!authSession;

    console.log('Auth Status:', {
      isLoading,
      isAuthenticated,
      inAuthGroup,
      user: user?.email || 'none'
    });

    if (!isAuthenticated && !inAuthGroup) {
      console.log('Redirecting to login');
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      console.log('Redirecting to home');
      router.replace('/');
    }
  }, [authSession, segments, isLoading, user]);

  // Show loading indicator while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Render the app with different layouts based on authentication state
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}