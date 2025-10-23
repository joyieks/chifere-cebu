import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase configuration missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error) => {
  if (!error) return null;

  console.error('Supabase Error:', error);

  // Map common Supabase error codes to user-friendly messages
  const errorMessages = {
    'PGRST116': 'No data found',
    '23505': 'This record already exists',
    '23503': 'Cannot delete - record is being used elsewhere',
    '42501': 'Permission denied',
    'auth/invalid-email': 'Invalid email address',
    'auth/user-not-found': 'User not found',
    'auth/wrong-password': 'Incorrect password',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/email-already-in-use': 'Email is already registered',
  };

  return errorMessages[error.code] || error.message || 'An unexpected error occurred';
};

// Helper function to format Supabase timestamp to Date
export const parseSupabaseTimestamp = (timestamp) => {
  if (!timestamp) return null;
  return new Date(timestamp);
};

// Helper function to create a timestamp for Supabase
export const createSupabaseTimestamp = () => {
  return new Date().toISOString();
};

export default supabase;
