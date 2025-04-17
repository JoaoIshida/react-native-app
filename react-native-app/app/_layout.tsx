import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { auth } from '@/lib/supabase/auth';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Root layout wrapper that handles auth state
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

// Navigation component that renders different layouts based on auth state
function RootLayoutNav() {
  const { authSession, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const isAuthenticated = !!authSession;

    if (
      // If user is not authenticated, redirect to login
      !isAuthenticated &&
      !inAuthGroup
    ) {
      router.replace('/auth/login');
    } else if (
      // If user is authenticated, redirect to home if they're on an auth screen
      isAuthenticated &&
      inAuthGroup
    ) {
      router.replace('/');
    }
  }, [authSession, segments, isLoading]);

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