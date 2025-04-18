import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { debugLog } from './debug';

// Safely check if we're in a web environment AND localStorage is available
const isWeb = Platform.OS === 'web';
const hasLocalStorage = isWeb && typeof localStorage !== 'undefined';

// If localStorage isn't available, use an in-memory fallback
const memoryStorage = {};

// Web storage adapter implementation with safety checks
const webStorageAdapter = {
    getItem: async (key) => {
        try {
            if (hasLocalStorage) {
                return localStorage.getItem(key);
            } else {
                // Use in-memory fallback if localStorage isn't available
                return memoryStorage[key] || null;
            }
        } catch (error) {
            debugLog('Web storage getItem error:', error);
            return null;
        }
    },
    setItem: async (key, value) => {
        try {
            if (hasLocalStorage) {
                localStorage.setItem(key, value);
            } else {
                // Use in-memory fallback if localStorage isn't available
                memoryStorage[key] = value;
            }
            return;
        } catch (error) {
            debugLog('Web storage setItem error:', error);
            return null;
        }
    },
    removeItem: async (key) => {
        try {
            if (hasLocalStorage) {
                localStorage.removeItem(key);
            } else {
                // Use in-memory fallback if localStorage isn't available
                delete memoryStorage[key];
            }
            return;
        } catch (error) {
            debugLog('Web storage removeItem error:', error);
            return null;
        }
    },
};

export const ExpoSecureStoreAdapter = isWeb
    ? webStorageAdapter
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
            const stringValue = JSON.stringify(value);

            if (isWeb) {
                if (hasLocalStorage) {
                    localStorage.setItem(key, stringValue);
                } else {
                    memoryStorage[key] = stringValue;
                }
            } else {
                await AsyncStorage.setItem(key, stringValue);
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
                if (hasLocalStorage) {
                    value = localStorage.getItem(key);
                } else {
                    value = memoryStorage[key] || null;
                }
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
                if (hasLocalStorage) {
                    localStorage.removeItem(key);
                } else {
                    delete memoryStorage[key];
                }
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
                if (hasLocalStorage) {
                    // On web, we use localStorage (not secure, but it's the closest equivalent)
                    localStorage.setItem(key, valueToStore);
                } else {
                    // Use in-memory fallback
                    memoryStorage[key] = valueToStore;
                }
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
                if (hasLocalStorage) {
                    value = localStorage.getItem(key);
                } else {
                    value = memoryStorage[key] || null;
                }
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
                if (hasLocalStorage) {
                    localStorage.removeItem(key);
                } else {
                    delete memoryStorage[key];
                }
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
                if (hasLocalStorage) {
                    keys.forEach(key => localStorage.removeItem(key));
                } else {
                    keys.forEach(key => delete memoryStorage[key]);
                }
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