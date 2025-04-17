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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../lib/supabase/auth';

const ResetPasswordScreen = () => {
    const router = useRouter();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordsMatch, setPasswordsMatch] = useState(true);

    // Check if passwords match whenever either field changes
    useEffect(() => {
        if (confirmPassword) {
            setPasswordsMatch(newPassword === confirmPassword);
        } else {
            setPasswordsMatch(true);
        }
    }, [newPassword, confirmPassword]);

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please enter and confirm your new password.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);

        try {
            const { error } = await auth.updatePassword(newPassword);

            if (error) {
                Alert.alert('Error', error.message);
            } else {
                Alert.alert(
                    'Success',
                    'Your password has been reset successfully.',
                    [
                        {
                            text: 'Sign In',
                            onPress: () => router.replace('/auth/login'),
                        },
                    ]
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to reset password. Please try again later.');
            console.error('Password reset error:', error);
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
                <View style={styles.content}>
                    <View style={styles.headerContainer}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.push('/auth/login')}
                        >
                            <Ionicons name="arrow-back" size={24} color="#007AFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerText}>Reset Password</Text>
                        <Text style={styles.subHeaderText}>
                            Create a new password for your account
                        </Text>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={22} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={[
                            styles.inputContainer,
                            !passwordsMatch && styles.inputError
                        ]}>
                            <Ionicons
                                name="lock-closed-outline"
                                size={22}
                                color={!passwordsMatch ? "#FF3B30" : "#666"}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        {!passwordsMatch && (
                            <Text style={styles.errorText}>Passwords do not match</Text>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.resetButton,
                                (!passwordsMatch || loading) && styles.disabledButton
                            ]}
                            onPress={handleResetPassword}
                            disabled={!passwordsMatch || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.resetButtonText}>Reset Password</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => router.replace('/auth/login')}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.infoContainer}>
                        <Ionicons name="information-circle-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>
                            Password must be at least 6 characters long
                        </Text>
                    </View>
                </View>
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
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    headerContainer: {
        marginBottom: 32,
    },
    backButton: {
        marginBottom: 16,
    },
    headerText: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subHeaderText: {
        fontSize: 16,
        color: '#666',
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
    inputError: {
        borderColor: '#FF3B30',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        marginTop: -8,
        marginBottom: 16,
        marginLeft: 8,
    },
    resetButton: {
        backgroundColor: '#007AFF',
        height: 56,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        backgroundColor: '#007AFF80',
    },
    cancelButton: {
        height: 56,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        padding: 16,
        borderRadius: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
        flex: 1,
    },
});

// Export the component as default
export default ResetPasswordScreen;