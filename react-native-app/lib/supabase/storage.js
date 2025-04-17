// src/lib/supabase/storage.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { debugLog } from './debug';

// Check if the current platform is web
const isWeb = Platform.OS === 'web';

// Web localStorage adapter implementation
const webLocalStorageAdapter = {
    getItem: async (key) => {
        try {
            const value = localStorage.getItem(key);
            return value;
        } catch (error) {
            debugLog('Web localStorage getItem error:', error);
            return null;
        }
    },
    setItem: async (key, value) => {
        try {
            localStorage.setItem(key, value);
            return;
        } catch (error) {
            debugLog('Web localStorage setItem error:', error);
            return null;
        }
    },
    removeItem: async (key) => {
        try {
            localStorage.removeItem(key);
            return;
        } catch (error) {
            debugLog('Web localStorage removeItem error:', error);
            return null;
        }
    },
};

export const ExpoSecureStoreAdapter = isWeb
    ? webLocalStorageAdapter
    : {
        getItem: async (key) => {
            try {
                // Check if the key should use SecureStore (for sensitive data)
                if (key.includes('auth') || key.includes('token') || key.includes('refresh')) {
                    // SecureStore is used for sensitive data like authentication tokens
                    return SecureStore.getItemAsync(key);
                } else {
                    // AsyncStorage is used for non-sensitive and larger data
                    return AsyncStorage.getItem(key);
                }
            } catch (error) {
                debugLog('Storage getItem error:', error);
                return null;
            }
        },

        setItem: async (key, value) => {
            try {
                if (key.includes('auth') || key.includes('token') || key.includes('refresh')) {
                    // Store sensitive data in SecureStore (max size of ~2mb)
                    return SecureStore.setItemAsync(key, value);
                } else {
                    // Store non-sensitive data in AsyncStorage
                    return AsyncStorage.setItem(key, value);
                }
            } catch (error) {
                debugLog('Storage setItem error:', error);
                return null;
            }
        },

        removeItem: async (key) => {
            try {
                if (key.includes('auth') || key.includes('token') || key.includes('refresh')) {
                    return SecureStore.deleteItemAsync(key);
                } else {
                    return AsyncStorage.removeItem(key);
                }
            } catch (error) {
                debugLog('Storage removeItem error:', error);
                return null;
            }
        },
    };

/**
 * Storage utilities for handling app data
 */
export const storage = {
    /**
     * Save data to storage
     * 
     * @param {string} key - Storage key
     * @param {any} value - Value to store (will be JSON stringified)
     * @returns {Promise} - Operation result
     */
    save: async (key, value) => {
        try {
            if (isWeb) {
                localStorage.setItem(key, JSON.stringify(value));
            } else {
                await AsyncStorage.setItem(key, JSON.stringify(value));
            }
            debugLog(`Data saved to storage: ${key}`);
            return { error: null };
        } catch (error) {
            debugLog(`Error saving to storage: ${key}`, error);
            return { error };
        }
    },

    /**
     * Get data from storage
     * 
     * @param {string} key - Storage key
     * @returns {Promise} - Stored data or error
     */
    get: async (key) => {
        try {
            let value;
            if (isWeb) {
                value = localStorage.getItem(key);
            } else {
                value = await AsyncStorage.getItem(key);
            }
            const parsedValue = value ? JSON.parse(value) : null;
            return { data: parsedValue, error: null };
        } catch (error) {
            debugLog(`Error getting from storage: ${key}`, error);
            return { data: null, error };
        }
    },

    /**
     * Remove data from storage
     * 
     * @param {string} key - Storage key
     * @returns {Promise} - Operation result
     */
    remove: async (key) => {
        try {
            if (isWeb) {
                localStorage.removeItem(key);
            } else {
                await AsyncStorage.removeItem(key);
            }
            debugLog(`Data removed from storage: ${key}`);
            return { error: null };
        } catch (error) {
            debugLog(`Error removing from storage: ${key}`, error);
            return { error };
        }
    },

    /**
     * Save secure data (not secure on web)
     * 
     * @param {string} key - Storage key
     * @param {string} value - Value to store securely
     * @returns {Promise} - Operation result
     */
    saveSecure: async (key, value) => {
        try {
            const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);

            if (isWeb) {
                // On web, we use localStorage (not secure, but it's the closest equivalent)
                localStorage.setItem(key, valueToStore);
            } else {
                // On native, we use SecureStore
                await SecureStore.setItemAsync(key, valueToStore);
            }

            debugLog(`Data saved to secure storage: ${key}`);
            return { error: null };
        } catch (error) {
            debugLog(`Error saving to secure storage: ${key}`, error);
            return { error };
        }
    },

    /**
     * Get secure data
     * 
     * @param {string} key - Storage key
     * @param {boolean} parse - Whether to parse the result as JSON
     * @returns {Promise} - Stored secure data or error
     */
    getSecure: async (key, parse = false) => {
        try {
            let value;

            if (isWeb) {
                // On web, we use localStorage
                value = localStorage.getItem(key);
            } else {
                // On native, we use SecureStore
                value = await SecureStore.getItemAsync(key);
            }

            if (value && parse) {
                try {
                    return { data: JSON.parse(value), error: null };
                } catch (parseError) {
                    return { data: value, error: null }; // Return as string if parsing fails
                }
            }

            return { data: value, error: null };
        } catch (error) {
            debugLog(`Error getting from secure storage: ${key}`, error);
            return { data: null, error };
        }
    },

    /**
     * Remove secure data
     * 
     * @param {string} key - Storage key
     * @returns {Promise} - Operation result
     */
    removeSecure: async (key) => {
        try {
            if (isWeb) {
                // On web, we use localStorage
                localStorage.removeItem(key);
            } else {
                // On native, we use SecureStore
                await SecureStore.deleteItemAsync(key);
            }

            debugLog(`Data removed from secure storage: ${key}`);
            return { error: null };
        } catch (error) {
            debugLog(`Error removing from secure storage: ${key}`, error);
            return { error };
        }
    },

    /**
     * Clear multiple items from storage
     * 
     * @param {string[]} keys - Array of keys to remove
     * @returns {Promise} - Operation result
     */
    clearMultiple: async (keys) => {
        try {
            if (isWeb) {
                // On web, we use localStorage
                keys.forEach(key => localStorage.removeItem(key));
            } else {
                // On native, we use AsyncStorage
                await AsyncStorage.multiRemove(keys);
            }

            debugLog(`Multiple items cleared from storage: ${keys.join(', ')}`);
            return { error: null };
        } catch (error) {
            debugLog(`Error clearing multiple items from storage`, error);
            return { error };
        }
    }
};