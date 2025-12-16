import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Check if Supabase credentials are available
const supabaseUrl = projectId ? `https://${projectId}.supabase.co` : '';
const supabaseKey = publicAnonKey || '';

// Flag to indicate if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey && projectId);

// Create Supabase client only if credentials are available
// If not configured, create a mock client that won't crash
let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

// Export a client that handles the unconfigured case gracefully
export const supabase = supabaseInstance || createMockClient();

// Create a mock Supabase client for when credentials are missing
function createMockClient(): any {
  const mockError = { message: 'Supabase not configured. Please check environment variables.' };
  
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: mockError }),
      getSession: async () => ({ data: { session: null }, error: mockError }),
      signIn: async () => ({ data: null, error: mockError }),
      signUp: async () => ({ data: null, error: mockError }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: null, error: mockError }),
      resetPasswordForEmail: async () => ({ error: mockError }),
      updateUser: async () => ({ error: mockError }),
    },
    from: () => ({
      select: () => ({ data: null, error: mockError, single: () => ({ data: null, error: mockError }) }),
      insert: () => ({ data: null, error: mockError }),
      update: () => ({ eq: () => ({ data: null, error: mockError }) }),
      upsert: () => ({ data: null, error: mockError, select: () => ({ single: () => ({ data: null, error: mockError }) }) }),
      delete: () => ({ eq: () => ({ data: null, error: mockError }) }),
    }),
  };
}

// Helper function to check if user is super admin
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !data) return false;
    return data.role === 'superadmin';
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
}

// Helper function to get current user
export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  } catch (error: any) {
    // Only log if it's not a session missing error (expected when not logged in)
    if (error?.name !== 'AuthSessionMissingError' && !error?.message?.includes('session_missing')) {
      console.error('Error getting current user:', error);
    }
    return null;
  }
}

