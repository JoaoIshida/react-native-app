import React, { useEffect, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/supabase/auth';

// Import GoogleSigninButton conditionally for native platforms
let GoogleSigninButton = null;
if (Platform.OS !== 'web') {
    try {
        const { GoogleSigninButton: GSB } = require('@react-native-google-signin/google-signin');
        GoogleSigninButton = GSB;
    } catch (error) {
        console.error('Failed to import GoogleSigninButton:', error);
    }
}

const LoginScreen = () => {
    const router = useRouter();
    const { signIn, signUp } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Initialize Google Sign-In on component mount
    useEffect(() => {
        auth.initGoogleSignIn();
    }, []);

    const handleGoogleSignIn = async () => {
        try {
            setGoogleLoading(true);
            console.log("Starting Google sign-in process");

            const result = await auth.signInWithGoogle();

            // Only update state if we're not redirecting
            if (Platform.OS !== 'web') {
                setGoogleLoading(false);

                if (result.error) {
                    console.error("Google sign in error:", result.error);
                    Alert.alert('Sign In Error', result.error.message || 'Failed to sign in with Google. Please try again.');
                } else {
                    console.log("Google sign in successful");
                }
            }
        } catch (error) {
            console.error('Google sign in exception:', error);
            setGoogleLoading(false);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
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

    // Render Google button based on platform
    const renderGoogleButton = () => {
        if (Platform.OS !== 'web' && GoogleSigninButton) {
            // Native platforms - use the native Google button
            return (
                <GoogleSigninButton
                    style={styles.googleNativeButton}
                    size={GoogleSigninButton.Size.Wide}
                    color={GoogleSigninButton.Color.Light}
                    onPress={handleGoogleSignIn}
                    disabled={googleLoading}
                />
            );
        } else {
            // Web or fallback for native
            return (
                <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleSignIn}
                    disabled={googleLoading}
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
            );
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

                        {renderGoogleButton()}
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
    googleNativeButton: {
        width: '100%',
        height: 48,
        alignSelf: 'center',
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

export default LoginScreen;