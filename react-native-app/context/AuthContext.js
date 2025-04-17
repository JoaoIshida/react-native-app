import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/supabase/auth';
import { debugLog } from '@/lib/supabase/debug';

// Create a context to manage authentication state
const AuthContext = createContext({
    authSession: null,
    user: null,
    isLoading: true,
    signIn: async () => { },
    signUp: async () => { },
    signOut: async () => { },
    signInWithGoogle: async () => { },
    useGoogleAuth: () => { },
});

// Provider component that wraps your app and makes auth object available
export function AuthProvider({ children }) {
    const [authSession, setAuthSession] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Get the current session
                const { data } = await auth.getSession();

                if (data?.session) {
                    setAuthSession(data.session);
                    setUser(data.session.user);
                }
            } catch (error) {
                debugLog('Error initializing auth:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();

        // Set up auth state change listener
        const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
            debugLog('Auth state changed:', event);

            setAuthSession(session);
            setUser(session?.user || null);
            setIsLoading(false);
        });

        // Clean up subscription on unmount
        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // Sign in with email and password
    const signIn = async (email, password) => {
        setIsLoading(true);
        try {
            const result = await auth.signInWithEmail(email, password);
            return result;
        } finally {
            setIsLoading(false);
        }
    };

    // Sign up with email and password
    const signUp = async (email, password) => {
        setIsLoading(true);
        try {
            const result = await auth.signUpWithEmail(email, password);
            return result;
        } finally {
            setIsLoading(false);
        }
    };

    // Sign out
    const signOut = async () => {
        setIsLoading(true);
        try {
            const result = await auth.signOut();

            if (!result.error) {
                setAuthSession(null);
                setUser(null);
            }

            return result;
        } finally {
            setIsLoading(false);
        }
    };

    // Sign in with Google
    const signInWithGoogle = async (accessToken) => {
        setIsLoading(true);
        try {
            const result = await auth.signInWithGoogle(accessToken);
            return result;
        } finally {
            setIsLoading(false);
        }
    };

    // Pass through the Google auth hook
    const useGoogleAuth = auth.useGoogleAuth;

    // Provide the auth context to the app
    return (
        <AuthContext.Provider
            value={{
                authSession,
                user,
                isLoading,
                signIn,
                signUp,
                signOut,
                signInWithGoogle,
                useGoogleAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Hook to use the auth context
export function useAuth() {
    return useContext(AuthContext);
}