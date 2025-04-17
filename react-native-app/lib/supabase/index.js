import supabase from './createClient';
import { auth } from './auth';
import { crud } from './crud';
import { storage } from './storage';
import { DEBUG, debugLog } from './debug';

// Export all modules
export {
    supabase as default,
    auth,
    crud,
    storage,
    DEBUG,
    debugLog
};