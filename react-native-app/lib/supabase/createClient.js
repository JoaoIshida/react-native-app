import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import { ExpoSecureStoreAdapter } from './storage';

export const createSupabaseClient = () => {
    const supabase = createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            auth: {
                storage: ExpoSecureStoreAdapter,
                persistSession: true,
                detectSessionInUrl: false,
            },
            global: {
                headers: {
                    'x-app-version': '1.0.0', // Useful for debugging API issues
                    'x-platform': Platform.OS, // 'ios', 'android', or 'web' 
                },
            },
        }
    );

    // Set up debugging if in development mode
    // if (DEBUG) {
    //     supabase.realtime.setEndpoint(`${SUPABASE_URL}/realtime/v1`).setAuth(SUPABASE_ANON_KEY);
    //     setupFetchInterceptors();
    // }

    return supabase;
};

// Create a single instance of the Supabase client
const supabase = createSupabaseClient();

export default supabase;