import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import supabase from './createClient';
import { debugLog } from './debug';
import { EXPO_CLIENT_ID, IOS_CLIENT_ID, ANDROID_CLIENT_ID, WEB_CLIENT_ID } from '@env';

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

export const auth = {
    /**
     * Initialize Google Sign-In
     */
    initGoogleSignIn: () => {
        if (Platform.OS === 'web') {
            return; // No initialization needed for web
        }

        if (GoogleSignin) {
            GoogleSignin.configure({
                webClientId: WEB_CLIENT_ID, // Required for getting the idToken
                iosClientId: IOS_CLIENT_ID,
                androidClientId: ANDROID_CLIENT_ID,
                scopes: ['profile', 'email'],
                offlineAccess: false, // Don't need offline access for this implementation
            });
            console.log('Google Sign-In configured for native platform');
        } else {
            console.error('GoogleSignin is not available');
        }
    },

    /**
     * Sign in with Google - Platform-specific implementation
     */
    signInWithGoogle: async () => {
        debugLog('Attempting to sign in with Google');

        try {
            if (Platform.OS === 'web') {
                // For web, use Supabase's built-in OAuth flow
                console.log('Starting web Google OAuth flow');
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin,
                        queryParams: {
                            prompt: 'consent'  // This forces Google to show the consent screen again
                        }
                    }
                });

                if (error) {
                    console.error('Supabase OAuth error:', error);
                    return { data: null, error };
                }

                return { data, error: null };
            } else {
                // For native platforms, use GoogleSignin
                if (!GoogleSignin) {
                    console.error('GoogleSignin is not available');
                    return {
                        data: null,
                        error: new Error('Google Sign-In is not available on this platform')
                    };
                }

                // Check if play services are available (Android only)
                if (Platform.OS === 'android') {
                    await GoogleSignin.hasPlayServices();
                }

                console.log('Starting native Google Sign-In flow');
                const userInfo = await GoogleSignin.signIn();
                console.log('Google Sign-In successful, got user info');

                // Get the ID token
                const idToken = userInfo.idToken;
                if (!idToken) {
                    console.error('No ID token present in Google response');
                    return {
                        data: null,
                        error: new Error('No ID token received from Google')
                    };
                }

                console.log('Using ID token to sign in with Supabase');
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: idToken,
                    nonce: null, // Explicitly pass null if nonce checking is disabled
                });

                if (error) {
                    console.error('Supabase ID token sign in error:', error);
                    return { data: null, error };
                }

                console.log('Supabase authentication successful!');
                debugLog('Google sign in successful for user:', data.user?.id || 'Unknown user');

                if (data.user) {
                    try {
                        await AsyncStorage.setItem('lastSignIn', new Date().toISOString());
                        await AsyncStorage.setItem('userEmail', data.user.email);
                        await AsyncStorage.setItem('authProvider', 'google');
                    } catch (e) {
                        debugLog('Error storing user info', e);
                    }
                }

                return { data, error: null };
            }
        } catch (error) {
            console.error('Exception during Google sign in:', error);
            return { data: null, error };
        }
    },

    /**
     * Check if user has previously signed in
     */
    hasPreviousSignIn: async () => {
        if (Platform.OS === 'web') {
            // For web, check session
            const { data } = await supabase.auth.getSession();
            return !!data?.session;
        } else if (GoogleSignin) {
            // For native platforms
            return GoogleSignin.hasPreviousSignIn();
        }
        return false;
    },

    /**
     * Get the current user session with improved handling for OAuth redirects
     */
    getSession: async () => {
        debugLog('Getting current session');

        try {
            // For web platforms, handle hash fragments that contain auth tokens
            if (Platform.OS === 'web' && window.location.hash) {
                const hash = window.location.hash;

                if (hash.includes('access_token') || hash.includes('error')) {
                    console.log('Hash contains auth parameters, fetching fresh session');

                    // Extract the hash without the # character
                    const hashParams = window.location.hash.substring(1);

                    // Parse the parameters
                    const params = new URLSearchParams(hashParams);
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken) {
                        console.log('Setting session from hash parameters');
                        // Manually set the session
                        try {
                            const result = await supabase.auth.setSession({
                                access_token: accessToken,
                                refresh_token: refreshToken || '',
                            });

                            // Clear the hash
                            if (window.history && window.history.replaceState) {
                                window.history.replaceState(
                                    null,
                                    document.title,
                                    window.location.pathname + window.location.search
                                );
                            }

                            return result;
                        } catch (e) {
                            console.error('Error setting session from hash:', e);
                        }
                    }
                }
            }

            // Standard session retrieval
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                debugLog('Error getting session:', error.message);
            } else if (data?.session) {
                debugLog('Session successfully retrieved for user:', data.session.user.id);
            } else {
                debugLog('No active session found');
            }

            return { data, error };
        } catch (error) {
            debugLog('Exception getting session:', error);
            return { data: null, error };
        }
    },

    /**
     * Sign up with email and password
     */
    signUpWithEmail: async (email, password) => {
        debugLog('Attempting to sign up:', email);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${Platform.OS === 'web' ? window.location.origin : 'rna'}://verify-email`,
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
     * Sign in with email and password
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
     */
    signOut: async () => {
        debugLog('Attempting to sign out');

        // For native platforms, also sign out from Google
        if (Platform.OS !== 'web' && GoogleSignin) {
            try {
                await GoogleSignin.signOut();
                console.log('Signed out from Google');
            } catch (error) {
                console.error('Error signing out from Google:', error);
            }
        }

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
     * Reset password for a user
     */
    resetPassword: async (email) => {
        debugLog('Requesting password reset for:', email);
        return await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${Platform.OS === 'web' ? window.location.origin + '/auth/reset-password' : 'rna://reset-password'}`,
        });
    },

    /**
     * Update a user's password
     */
    updatePassword: async (newPassword) => {
        debugLog('Updating password');
        return await supabase.auth.updateUser({
            password: newPassword
        });
    },

    /**
     * Set up auth state change listener
     */
    onAuthStateChange: (callback) => {
        return supabase.auth.onAuthStateChange(callback);
    },

    /**
     * Handle auth deep links
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