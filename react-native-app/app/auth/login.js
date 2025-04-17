import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

const LoginScreen = () => {
    const router = useRouter();
    const { signIn, signUp, signInWithGoogle, useGoogleAuth } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Initialize Google Auth
    const [request, response, promptAsync] = useGoogleAuth();

    useEffect(() => {
        // Handle deep links for email verification and password reset
        const handleDeepLink = async (event) => {
            const { url } = event;
            if (url) {
                // Pass the URL to the auth module to handle authentication links
                const { auth } = await import('@/lib/supabase/auth');
                const result = await auth.handleAuthDeepLink(url);

                if (result && result.type === 'signup') {
                    Alert.alert('Success', 'Your email has been verified. You can now log in.');
                } else if (result && result.type === 'recovery') {
                    router.push('/auth/reset-password');
                }
            }
        };

        // Set up deep link listener
        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Check for initial URL (app opened from deep link)
        Linking.getInitialURL().then(url => {
            if (url) {
                handleDeepLink({ url });
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    // Handle Google Sign In response
    useEffect(() => {
        if (response?.type === 'success') {
            setGoogleLoading(true);
            handleGoogleSignIn(response.authentication.accessToken);
        }
    }, [response]);

    const handleGoogleSignIn = async (accessToken) => {
        try {
            const { error } = await signInWithGoogle(accessToken);
            setGoogleLoading(false);

            if (error) {
                Alert.alert('Error', error.message);
            }
            // No need to navigate - the auth context will handle that
        } catch (error) {
            setGoogleLoading(false);
            Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
            console.error('Google sign in error:', error);
        }
    };

    const handleEmailAuth = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }

        setLoading(true);

        try {
            let result;

            if (isLogin) {
                // Sign in
                result = await signIn(email, password);
            } else {
                // Sign up
                result = await signUp(email, password);
            }

            const { data, error } = result;

            if (error) {
                Alert.alert('Error', error.message);
            } else if (!isLogin && data.user && data.session === null) {
                // Sign up successful but needs email verification
                Alert.alert(
                    'Verification Email Sent',
                    'Please check your email to verify your account before logging in.'
                );
                setIsLogin(true); // Switch back to login view
            }
            // No need to navigate - the auth context will handle that
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            console.error('Auth error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address.');
            return;
        }

        setLoading(true);

        try {
            const { auth } = await import('@/lib/supabase/auth');
            const { error } = await auth.resetPassword(email);

            if (error) {
                Alert.alert('Error', error.message);
            } else {
                Alert.alert(
                    'Reset Email Sent',
                    'Please check your email for instructions to reset your password.'
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to send reset email. Please try again.');
            console.error('Reset password error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="auto" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.logoContainer}>
                        {/* Replace with your actual logo */}
                        <Text style={styles.logoText}>YourApp</Text>
                    </View>

                    <View style={styles.headerContainer}>
                        <Text style={styles.headerText}>
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </Text>
                        <Text style={styles.subHeaderText}>
                            {isLogin
                                ? 'Welcome back to the app'
                                : 'Enter your details to get started'}
                        </Text>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={22} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email Address"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={22} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        {isLogin && (
                            <TouchableOpacity
                                style={styles.forgotPasswordContainer}
                                onPress={handleForgotPassword}
                                disabled={loading}
                            >
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.authButton}
                            onPress={handleEmailAuth}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.authButtonText}>
                                    {isLogin ? 'Sign In' : 'Sign Up'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.separatorContainer}>
                            <View style={styles.separator} />
                            <Text style={styles.separatorText}>OR</Text>
                            <View style={styles.separator} />
                        </View>

                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={() => {
                                promptAsync();
                            }}
                            disabled={!request || googleLoading}
                        >
                            {googleLoading ? (
                                <ActivityIndicator color="#333" />
                            ) : (
                                <>
                                    <Ionicons name="logo-google" size={24} color="#333" style={styles.googleIcon} />
                                    <Text style={styles.googleButtonText}>
                                        Continue with Google
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.switchContainer}>
                        <Text style={styles.switchText}>
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                        </Text>
                        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                            <Text style={styles.switchButtonText}>
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    headerContainer: {
        marginBottom: 32,
    },
    headerText: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subHeaderText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    formContainer: {
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 16,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#007AFF',
        fontSize: 14,
    },
    authButton: {
        backgroundColor: '#007AFF',
        height: 56,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    authButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    separator: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd',
    },
    separatorText: {
        color: '#666',
        paddingHorizontal: 16,
        fontSize: 14,
    },
    googleButton: {
        flexDirection: 'row',
        backgroundColor: '#f7f7f7',
        height: 56,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    googleIcon: {
        marginRight: 8,
    },
    googleButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    switchText: {
        color: '#666',
        fontSize: 14,
    },
    switchButtonText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
});

// Export the component as default
export default LoginScreen;