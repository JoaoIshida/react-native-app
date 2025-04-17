// src/lib/supabase/auth.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Platform } from 'react-native';
import supabase from './createClient';
import { debugLog } from './debug';
import Constants from 'expo-constants';

// Register the WebBrowser for authentication sessions
WebBrowser.maybeCompleteAuthSession();

const getRedirectUri = () => {
    // For standalone apps
    if (Constants.appOwnership === 'standalone') {
        return `${Constants.expoConfig.scheme}://`;
    }

    // For Expo Go
    return `${Constants.expoConfig.scheme}://` || 'rna://';
};

export const auth = {
    /**
     * @returns {Object} - Google auth hook result
     * 
     * @example
     * const [request, response, promptAsync] = auth.useGoogleAuth();
     */
    useGoogleAuth: () => {
        return Google.useAuthRequest({
            expoClientId: 'EXPO_CLIENT_ID', // For Expo Go
            iosClientId: 'IOS_CLIENT_ID', // For iOS standalone app - com.joaoishida.rna
            androidClientId: 'ANDROID_CLIENT_ID', // For Android standalone app - com.joaoishida.rna
            webClientId: 'WEB_CLIENT_ID', // For web
            redirectUri: getRedirectUri(),
        });
    },

    /**
     * Sign in with Google
     * 
     * @param {Object} accessToken - Access token from Google auth
     * @returns {Promise} - Sign in result
     * 
     * @example
     * // Get the token from Google auth response
     * const { authentication } = response;
     * const { data, error } = await auth.signInWithGoogle(authentication.accessToken);
     */
    signInWithGoogle: async (accessToken) => {
        debugLog('Attempting to sign in with Google');

        const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: accessToken,
        });

        if (error) {
            debugLog('Google sign in error:', error.message);
        } else {
            debugLog('Google sign in successful for user:', data.user.id);

            if (data.user) {
                try {
                    await AsyncStorage.setItem('lastSignIn', new Date().toISOString());
                    await AsyncStorage.setItem('userEmail', data.user.email);
                    await AsyncStorage.setItem('authProvider', 'google');
                } catch (e) {
                    debugLog('Error storing user info', e);
                }
            }
        }

        return { data, error };
    },

    /**
     * Sign up with email verification
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise} - Sign up result
     * 
     * @example
     * const { data, error } = await auth.signUpWithEmail('user@example.com', 'password123');
     */
    signUpWithEmail: async (email, password) => {
        debugLog('Attempting to sign up:', email);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // This will send a verification email
                emailRedirectTo: `rna://verify-email`,
            },
        });

        if (error) {
            debugLog('Sign up error:', error.message);
        } else {
            debugLog('Sign up successful, verification email sent');

            try {
                await AsyncStorage.setItem('lastSignUpAttempt', new Date().toISOString());
                await AsyncStorage.setItem('authProvider', 'email');
            } catch (e) {
                debugLog('Error storing sign up timestamp', e);
            }
        }

        return { data, error };
    },

    /**
     * Sign in with email and password (once verified)
     * 
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise} - Sign in result
     * 
     * @example
     * const { data, error } = await auth.signInWithEmail('user@example.com', 'password123');
     */
    signInWithEmail: async (email, password) => {
        debugLog('Attempting to sign in with email:', email);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            debugLog('Sign in error:', error.message);
        } else {
            debugLog('Sign in successful for user:', data.user.id);

            if (data.user) {
                try {
                    await AsyncStorage.setItem('lastSignIn', new Date().toISOString());
                    await AsyncStorage.setItem('userEmail', data.user.email);
                    await AsyncStorage.setItem('authProvider', 'email');
                } catch (e) {
                    debugLog('Error storing user info', e);
                }
            }
        }

        return { data, error };
    },

    /**
     * Sign out the current user
     * 
     * @returns {Promise} - Sign out result
     * 
     * @example
     * const { error } = await auth.signOut();
     */
    signOut: async () => {
        debugLog('Attempting to sign out');

        const { error } = await supabase.auth.signOut();

        if (error) {
            debugLog('Sign out error:', error.message);
        } else {
            debugLog('Sign out successful');

            try {
                await AsyncStorage.multiRemove([
                    'lastSignIn',
                    'userEmail',
                    'userPreferences',
                    'authProvider'
                ]);
            } catch (e) {
                debugLog('Error clearing user data', e);
            }
        }

        return { error };
    },

    /**
     * Get the current user session
     * 
     * @returns {Promise} - Current session
     * 
     * @example
     * const { data, error } = await auth.getSession();
     */
    getSession: async () => {
        debugLog('Getting current session');
        return await supabase.auth.getSession();
    },

    /**
     * Get the current user
     * 
     * @returns {Promise} - Current user
     * 
     * @example
     * const { data, error } = await auth.getUser();
     */
    getUser: async () => {
        debugLog('Getting current user');
        return await supabase.auth.getUser();
    },

    /**
     * Reset password for a user
     * 
     * @param {string} email - User's email
     * @returns {Promise} - Reset password result
     * 
     * @example
     * const { data, error } = await auth.resetPassword('user@example.com');
     */
    resetPassword: async (email) => {
        debugLog('Requesting password reset for:', email);
        return await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `rna://reset-password`,
        });
    },

    /**
     * Update a user's password
     * 
     * @param {string} newPassword - New password
     * @returns {Promise} - Update password result
     * 
     * @example
     * const { data, error } = await auth.updatePassword('newPassword123');
     */
    updatePassword: async (newPassword) => {
        debugLog('Updating password');
        return await supabase.auth.updateUser({
            password: newPassword
        });
    },

    /**
     * Set up auth state change listener
     * 
     * @param {Function} callback - Function to call when auth state changes
     * @returns {Function} - Unsubscribe function
     * 
     * @example
     * const unsubscribe = auth.onAuthStateChange((event, session) => {
     *   if (event === 'SIGNED_IN') console.log('User signed in!');
     *   if (event === 'SIGNED_OUT') console.log('User signed out!');
     * });
     * 
     * // Clean up subscription when component unmounts
     * return () => unsubscribe();
     */
    onAuthStateChange: (callback) => {
        return supabase.auth.onAuthStateChange(callback);
    },

    /**
     * Check if a deep link is an auth link and process it
     * 
     * @param {string} url - The URL from the deep link
     * @returns {Promise} - Auth result or null if not an auth link
     * 
     * @example
     * // In your deep link handler
     * Linking.addEventListener('url', ({ url }) => {
     *   auth.handleAuthDeepLink(url);
     * });
     */
    handleAuthDeepLink: async (url) => {
        try {
            if (url && (url.includes('verify-email') || url.includes('reset-password'))) {
                debugLog('Processing auth deep link:', url);

                // Extract parameters from URL
                const params = new URL(url).searchParams;
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');
                const type = params.get('type');

                if (accessToken && type) {
                    // Set the session
                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken || '',
                    });

                    return { data, error, type };
                }
            }

            return null;
        } catch (error) {
            debugLog('Error handling auth deep link:', error);
            return { data: null, error, type: 'error' };
        }
    }
};