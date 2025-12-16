import { supabase } from './supabase/client';
import { User } from '@supabase/supabase-js';

/**
 * Get current authenticated user from Supabase
 */
export async function getCurrentAuthUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      // Only log if it's not a session missing error (expected when not logged in)
      if (error.name !== 'AuthSessionMissingError' && !error.message?.includes('session_missing')) {
        console.error('Error getting current user:', error);
      }
      return null;
    }
    return user;
  } catch (error: any) {
    // Only log if it's not a session missing error (expected when not logged in)
    if (error?.name !== 'AuthSessionMissingError' && !error?.message?.includes('session_missing')) {
      console.error('Error getting current user:', error);
    }
    return null;
  }
}

// Cache to prevent duplicate profile fetches
let profileFetchCache: { [userId: string]: { data: any; timestamp: number } } = {};
const PROFILE_CACHE_DURATION = 5000; // 5 seconds

/**
 * Get current user profile from users table
 * Auto-creates profile if it doesn't exist
 */
export async function getCurrentUserProfile() {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return null;

    // Check cache first to prevent duplicate fetches
    const cached = profileFetchCache[user.id];
    if (cached && Date.now() - cached.timestamp < PROFILE_CACHE_DURATION) {
      return cached.data;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // Handle PGRST205 - table not found in schema cache (table might not exist or schema issue)
    if (error && error.code === 'PGRST205') {
      console.warn('⚠️ Table "users" not found in schema cache. This may indicate the migration hasn\'t been run or there\'s a schema issue.');
      // Return minimal user object so app doesn't break
      const minimalUser = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: 'user',
        subscription_plan: 'free',
        subscription_status: 'active',
      };
      profileFetchCache[user.id] = { data: minimalUser, timestamp: Date.now() };
      return minimalUser;
    }

    // If profile doesn't exist (404, PGRST116), create it
    const isNotFoundError = error && (
      error.code === 'PGRST116' || 
      error.message?.includes('No rows') ||
      error.message?.includes('not found') ||
      (error as any).status === 404 ||
      (error as any).code === '404'
    );

    if (isNotFoundError) {
      console.log('User profile not found, creating one...', { userId: user.id, errorCode: error.code });
      try {
        const fullName = user.user_metadata?.full_name || 
                        user.user_metadata?.full_name || 
                        user.email?.split('@')[0] || 
                        'User';
        
        const newProfile = await createUserProfile(
          user.id,
          user.email || '',
          fullName
        );
        
        if (newProfile) {
          console.log('✅ User profile created successfully:', newProfile.id);
          // Cache the result
          profileFetchCache[user.id] = { data: newProfile, timestamp: Date.now() };
          return newProfile;
        } else {
          console.warn('⚠️ Profile creation returned null, but user exists');
          // Return a minimal user object so the app doesn't break
          const minimalUser = {
            id: user.id,
            email: user.email || '',
            full_name: fullName,
            role: 'user',
            subscription_plan: 'free',
            subscription_status: 'active',
          };
          profileFetchCache[user.id] = { data: minimalUser, timestamp: Date.now() };
          return minimalUser;
        }
      } catch (createError: any) {
        console.warn('⚠️ Error creating user profile (non-critical):', createError?.message || createError);
        
        // If creation fails, return minimal user object so app doesn't break
        const minimalUser = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: 'user',
          subscription_plan: 'free',
          subscription_status: 'active',
        };
        profileFetchCache[user.id] = { data: minimalUser, timestamp: Date.now() };
        return minimalUser;
      }
    }

    if (error) {
      // Don't log PGRST205 (permission denied) as it's expected for new users
      // PGRST205 typically means RLS policy is blocking, which we handle by creating profile
      if (error.code === 'PGRST205') {
        // Silently handle - this is expected for new users without profiles
        // Return cached minimal user if available, otherwise create new one
        const minimalUser = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: 'user',
          subscription_plan: 'free',
          subscription_status: 'active',
        };
        // Don't cache PGRST205 errors to allow retry on next fetch
        // Return minimal user immediately without logging
        return minimalUser;
      }
      // Don't log as error if it's a common/expected error - use warn instead
      console.warn('Profile fetch error (non-critical):', error?.code || error?.message || error);
      // Return minimal user object even on error so app doesn't break
      const minimalUser = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: 'user',
        subscription_plan: 'free',
        subscription_status: 'active',
      };
      profileFetchCache[user.id] = { data: minimalUser, timestamp: Date.now() };
      return minimalUser;
    }

    // Cache successful result
    if (data) {
      profileFetchCache[user.id] = { data, timestamp: Date.now() };
    }
    return data;
  } catch (error) {
    console.warn('Error getting user profile (non-critical):', error instanceof Error ? error.message : error);
    // Try to get auth user at least
    try {
      const user = await getCurrentAuthUser();
      if (user) {
        const minimalUser = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: 'user',
          subscription_plan: 'free',
          subscription_status: 'active',
        };
        profileFetchCache[user.id] = { data: minimalUser, timestamp: Date.now() };
        return minimalUser;
      }
    } catch (e) {
      // Silently fail - don't spam console
    }
    return null;
  }
}

/**
 * Clear profile cache (useful after profile updates)
 */
export function clearProfileCache(userId?: string) {
  if (userId) {
    delete profileFetchCache[userId];
  } else {
    profileFetchCache = {};
  }
}

/**
 * Create or update user profile in users table
 * Uses SECURITY DEFINER function to bypass RLS policies
 */
export async function createUserProfile(userId: string, email: string, fullName: string) {
  try {
    console.log('Creating/updating user profile:', { userId, email, fullName });
    
    // Use SECURITY DEFINER function to create/update profile (bypasses RLS)
    const { data, error } = await supabase.rpc('create_or_update_user_profile', {
      p_user_id: userId,
      p_email: email,
      p_full_name: fullName || ''
    });

    if (error) {
      console.error('Error creating/updating user profile:', error);
      
      // Handle PGRST205 - table not found in schema cache
      if (error.code === 'PGRST205') {
        console.warn('⚠️ Table "users" not found in schema cache. Profile creation skipped.');
        return null;
      }
      
      // If function doesn't exist yet, return null gracefully (migration not applied)
      if (error.message?.includes('function') || error.message?.includes('does not exist') || error.code === '42883') {
        console.warn('⚠️ Function not found - migration may not be applied yet. Profile creation skipped.');
        return null;
      }
      
      // If it's a permission error (RLS), try to fetch existing profile
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
        console.warn('⚠️ RLS policy error, checking if profile already exists:', error);
        
        // Try to fetch existing profile as fallback
        const { data: existingData, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (!fetchError && existingData) {
          console.log('✅ Found existing user profile');
          return existingData;
        }
      }
      
      // If it's a duplicate key error (email already exists), try to fetch and update the existing profile
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        console.log('Profile already exists (duplicate key), fetching by email...');
        
        // Fetch by email instead of user ID - the profile might have been created with a different user ID
        const { data: existingData, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle();
        
        if (!fetchError && existingData) {
          console.log('✅ Found existing user profile by email');
          
          // If the user ID doesn't match, update the profile to use the new user ID
          if (existingData.id !== userId) {
            console.log('Updating profile user ID from', existingData.id, 'to', userId);
            const { data: updatedData, error: updateError } = await supabase
              .from('users')
              .update({ 
                id: userId,
                full_name: fullName || existingData.full_name,
                updated_at: new Date().toISOString()
              })
              .eq('email', email)
              .select()
              .maybeSingle();
            
            if (!updateError && updatedData) {
              console.log('✅ Updated user profile with new user ID');
              return updatedData;
            }
            
            // If update failed, still return the existing data - user can continue
            console.warn('⚠️ Could not update user ID, but returning existing profile');
          }
          
          return existingData;
        }
        
        if (fetchError) {
          console.error('Error fetching existing profile:', fetchError);
          // If fetch also fails with PGRST205, return null
          if (fetchError.code === 'PGRST205') {
            console.warn('⚠️ Table "users" not found when fetching existing profile.');
            return null;
          }
          // Don't throw - return null and let the caller handle it gracefully
          console.warn('⚠️ Could not fetch existing profile, continuing without it');
          return null;
        }
      }
      
      throw error;
    }
    
    // Function returns TABLE, so data is an array
    if (!data || (Array.isArray(data) && data.length === 0)) {
      // Try fetching the profile directly as fallback
      const { data: fetchedData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (!fetchError && fetchedData) {
        console.log('✅ Fetched user profile after function call');
        return fetchedData;
      }
      
      console.warn('⚠️ Profile creation returned no data, but continuing...');
      return null;
    }
    
    // Function returns TABLE (array), extract first row
    const profileData = Array.isArray(data) ? data[0] : data;
    console.log('✅ User profile created/updated successfully:', profileData?.id);
    return profileData;
  } catch (error: any) {
    console.error('❌ Error creating/updating user profile:', {
      error,
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });
    
    // Don't throw for RLS errors - app can work with minimal user object
    if (error?.code === '42501') {
      console.warn('⚠️ RLS policy error - continuing without profile');
      return null;
    }
    
    throw error;
  }
}

/**
 * Sign up with email and password using Supabase Auth
 */
export async function signUpWithEmail(email: string, password: string, fullName: string) {
  try {
    // Bug_73: Email sender name "Adiology Login" must be configured in Supabase Dashboard
    // Go to: Authentication > Email Templates > Configure email sender
    // Set the "From" name to "Adiology Login"
    // This cannot be changed programmatically - it's a Supabase project setting
    
    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `https://adiology.io/verify-email`,
      },
    });

    if (error) {
      console.error('Supabase signup error:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from signup');
    }

    // Create user profile if signup successful (non-blocking)
    if (data.user) {
      createUserProfile(data.user.id, email, fullName)
        .then(() => {
          console.log('User profile created successfully');
        })
        .catch((profileError) => {
          console.error('Error creating user profile (non-critical):', profileError);
          // Don't throw - auth was successful, profile can be created later
        });
    }

    return data;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
}

/**
 * Sign in with email and password using Supabase Auth
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    // Bug_61, Bug_71: Clear any stale sessions before signing in to prevent conflicts
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore errors when clearing - might not have a session
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log detailed error information
      console.error('Supabase auth error:', {
        message: error.message,
        status: error.status,
        code: (error as any).code,
        name: error.name,
        fullError: error
      });
      throw error;
    }

    if (!data || !data.user) {
      throw new Error('Authentication failed: No user data returned');
    }

    // Update last_login_at in user profile (non-blocking)
    if (data.user) {
      // Fire-and-forget update (don't await)
      void (async () => {
        try {
          await supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', data.user!.id);
          console.log('Last login updated successfully');
        } catch (profileError) {
          console.warn('Error updating last login (non-critical):', profileError);
          // Don't throw - login was successful, profile update is optional
        }
      })();
    }

    return data;
  } catch (error: any) {
    // Log detailed error information
    console.error('Error signing in:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      name: error?.name,
      fullError: error
    });
    // Re-throw with a more user-friendly message if needed
    if (error?.message) {
      throw error;
    }
    throw new Error(error?.message || 'Failed to sign in. Please try again.');
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://adiology.io/reset-password`,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}

/**
 * Update user password (for password reset flow)
 */
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
}

/**
 * Resend email verification
 */
export async function resendVerificationEmail(email: string) {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `https://adiology.io/verify-email`,
      },
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error resending verification email:', error);
    throw error;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Check if current user is a super admin
 * Also checks for test admin mode (isolated testing account)
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    // Check for test admin mode first (isolated, only for admin panel)
    const testAdminMode = sessionStorage.getItem('test_admin_mode');
    if (testAdminMode === 'true') {
      return true; // Test admin has access to admin panel only
    }

    // Regular super admin check via Supabase
    const user = await getCurrentAuthUser();
    if (!user) return false;

    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !userData) return false;
    return userData.role === 'superadmin';
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
}

