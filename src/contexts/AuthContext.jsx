import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Session refresh mechanism
  useEffect(() => {
    const refreshAdminSession = () => {
      const adminSession = localStorage.getItem('admin_session');
      if (adminSession) {
        try {
          const adminUser = JSON.parse(adminSession);
          if (adminUser && adminUser.role === 'admin') {
            // Extend session by 24 hours
            const updatedSession = {
              ...adminUser,
              sessionTimestamp: Date.now(),
              expiresAt: Date.now() + (24 * 60 * 60 * 1000)
            };
            localStorage.setItem('admin_session', JSON.stringify(updatedSession));
          }
        } catch (error) {
          console.error('Error refreshing admin session:', error);
        }
      }
    };

    // Refresh session every 30 minutes
    const interval = setInterval(refreshAdminSession, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      console.log('🔍 [AuthContext] Getting initial session...');
      
      // Don't restore session if we're in the middle of logging out
      if (isLoggingOut) {
        console.log('🚪 [AuthContext] Skipping session restoration - logout in progress');
        setLoading(false);
        return;
      }
      
      try {
        // First check for admin session in localStorage
        const adminSession = localStorage.getItem('admin_session');
        if (adminSession) {
          try {
            const adminUser = JSON.parse(adminSession);
            console.log('✅ [AuthContext] Admin session found in localStorage:', adminUser);
            
            // Validate admin session data and check expiration
            if (adminUser && adminUser.id && adminUser.email && adminUser.role === 'admin') {
              // Check if session has expired
              if (adminUser.expiresAt && Date.now() > adminUser.expiresAt) {
                console.warn('⚠️ [AuthContext] Admin session expired, removing...');
                localStorage.removeItem('admin_session');
              } else {
                console.log('✅ [AuthContext] Valid admin session restored');
                setUser(adminUser);
                setLoading(false);
                return;
              }
            } else {
              console.warn('⚠️ [AuthContext] Invalid admin session data, removing...');
              localStorage.removeItem('admin_session');
            }
          } catch (error) {
            console.error('❌ [AuthContext] Error parsing admin session:', error);
            localStorage.removeItem('admin_session');
          }
        }

        // Check for regular Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔍 [AuthContext] Session result:', { session: !!session, error });
        
        if (session?.user) {
          console.log('✅ [AuthContext] User found, setting basic user immediately');
          
          // Set basic user immediately for instant app load
          const basicUser = {
            id: session.user.id,
            email: session.user.email,
            user_type: session.user.user_metadata?.user_type || 'buyer',
            role: session.user.user_metadata?.user_type || 'buyer', // Add role property for compatibility
            name: session.user.user_metadata?.display_name || session.user.email.split('@')[0],
            avatar: '/default-avatar.png'
          };
          
          setUser(basicUser);
          setLoading(false); // Set loading false immediately
          
          // Load full profile in background (non-blocking)
          loadUserProfile(session.user).catch(err => {
            console.error('❌ [AuthContext] Profile load failed:', err);
          });
        } else {
          console.log('❌ [AuthContext] No session found');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ [AuthContext] Error getting session:', error);
        setLoading(false);
      }
    };

    // Add a small delay to ensure proper session restoration
    const timeoutId = setTimeout(() => {
      getInitialSession();
    }, 100);

    return () => clearTimeout(timeoutId);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 [AuthContext] Auth state changed:', event);
        
        // Don't restore session if we're logging out
        if (isLoggingOut && event === 'SIGNED_OUT') {
          console.log('🚪 [AuthContext] Sign out event received, clearing user state');
          setUser(null);
          setLoading(false);
          setIsLoggingOut(false);
          return;
        }
        
        if (session?.user) {
          // Load full profile immediately (not in background)
          loadUserProfile(session.user).catch(err => {
            console.error('❌ [AuthContext] Profile load failed:', err);
            // Fallback to basic user if profile load fails
            const basicUser = {
              id: session.user.id,
              email: session.user.email,
              user_type: session.user.user_metadata?.user_type || 'buyer',
              role: session.user.user_metadata?.user_type || 'buyer', // Add role property for compatibility
              name: session.user.user_metadata?.display_name || session.user.email.split('@')[0],
              avatar: '/default-avatar.png'
            };
            setUser(basicUser);
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [isLoggingOut]);

  const loadUserProfile = async (authUser) => {
    console.log('👤 [AuthContext] Loading user profile for:', authUser.email);
    try {
      const userType = authUser.user_metadata?.user_type || 'buyer';
      console.log('📊 [AuthContext] User type:', userType);
      
      // Determine which table to query based on user type
      const tableName = userType === 'buyer' ? 'buyer_users' : 'user_profiles';
      
      console.log(`🔍 [AuthContext] Querying table: ${tableName} for email: ${authUser.email}`);
      
      // Get user profile from correct table BY EMAIL (not by auth.id!)
      const { data: profile, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (error || !profile) {
        console.warn('⚠️ [AuthContext] Error loading profile from DB:', error?.message || 'No profile found');
        console.log('📋 [AuthContext] Attempted table:', tableName);
        // If no profile found, create a basic one
        const basicProfile = {
          id: authUser.id,
          email: authUser.email,
          user_type: userType,
          role: userType, // Add role property for compatibility
          display_name: authUser.user_metadata?.display_name || authUser.email.split('@')[0],
          first_name: authUser.user_metadata?.first_name || '',
          last_name: authUser.user_metadata?.last_name || '',
          is_verified: authUser.email_confirmed_at ? true : false,
          avatar: '/default-avatar.png',
          name: authUser.user_metadata?.first_name || authUser.user_metadata?.display_name || 'User'
        };
        console.log('✅ [AuthContext] Using basic profile:', basicProfile);
        setUser(basicProfile);
        return;
      }

      console.log('✅ [AuthContext] Profile loaded from DB:', profile.email, profile.user_type || userType);
      console.log('👤 [AuthContext] First name from DB:', profile.first_name);
      console.log('👤 [AuthContext] Display name from DB:', profile.display_name);
      console.log('👤 [AuthContext] Seller status from DB:', profile.seller_status);
      
      // Merge profile data with existing user (don't replace, update!)
      setUser(prevUser => ({
        ...prevUser, // Keep existing data
        id: profile.id,
        email: profile.email,
        user_type: profile.user_type || userType,
        role: profile.user_type || userType, // Add role property for compatibility
        seller_status: profile.seller_status, // Include seller_status for seller verification
        display_name: profile.display_name,
        first_name: profile.first_name,
        last_name: profile.last_name,
        middle_name: profile.middle_name,
        phone: profile.phone,
        address: profile.address,
        profile_image: profile.profile_image,
        is_verified: profile.is_verified,
        is_active: profile.is_active,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        avatar: profile.profile_image || '/default-avatar.png',
        name: profile.first_name || profile.display_name || 'User'
      }));
      
      console.log('✅ [AuthContext] User updated with first_name:', profile.first_name);
    } catch (error) {
      console.error('❌ [AuthContext] Exception in loadUserProfile:', error);
      // Don't override user on error, just log it
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('🔐 [AuthContext] Auto-detecting user type for:', email);
      
      // 1. Check admin_users table first
      console.log('🔍 [AuthContext] Checking admin_users table...');
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single();

      if (!adminError && adminUser) {
        console.log('✅ [AuthContext] Found admin user:', adminUser.email);
        
        // Check password - try multiple methods
        let passwordMatch = false;
        
        // Direct comparison
        if (adminUser.password_hash === password) {
          passwordMatch = true;
        }
        
        // Try base64 decoding and comparison
        if (!passwordMatch) {
          try {
            const decodedPassword = atob(adminUser.password_hash);
            if (decodedPassword === password) {
              passwordMatch = true;
            }
          } catch (e) {
            console.log('❌ [AuthContext] Base64 decode failed:', e);
          }
        }
        
        // For admin@gmail.com, check if password is "admin123"
        if (!passwordMatch && email === 'admin@gmail.com' && password === 'admin123') {
          passwordMatch = true;
        }
        
        if (passwordMatch) {
          // Create admin user object
          const adminUserObj = {
            id: adminUser.id,
            email: adminUser.email,
            name: `${adminUser.first_name} ${adminUser.last_name}`,
            role: 'admin',
            user_type: 'admin',
            avatar: '/default-avatar.png',
            admin_role: adminUser.role
          };

          console.log('✅ [AuthContext] Admin login successful:', adminUserObj);
          setUser(adminUserObj);
          setLoading(false);

          // Store admin session in localStorage for persistence with timestamp
          const adminSessionData = {
            ...adminUserObj,
            sessionTimestamp: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
          };
          localStorage.setItem('admin_session', JSON.stringify(adminSessionData));

          return { 
            success: true, 
            user_type: 'admin',
            actualRole: 'admin'
          };
        } else {
          console.log('❌ [AuthContext] Invalid admin password');
          return { success: false, error: 'Invalid admin credentials' };
        }
      }

      // 2. Check user_profiles table for sellers
      console.log('🔍 [AuthContext] Checking user_profiles table...');
      const { data: sellerUser, error: sellerError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (!sellerError && sellerUser) {
        console.log('✅ [AuthContext] Found seller user:', sellerUser.email);
        
        // Try Supabase auth for seller
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!error && data.user) {
          // Load profile immediately and wait for it
          await loadUserProfile(data.user);
          
          return { 
            success: true, 
            user_type: 'seller',
            seller_status: sellerUser.seller_status || 'pending'
          };
        } else {
          console.log('❌ [AuthContext] Invalid seller credentials');
          return { success: false, error: 'Invalid seller credentials' };
        }
      }

      // 3. Try regular auth for buyers
      console.log('🔍 [AuthContext] Checking for buyer user...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        console.log('✅ [AuthContext] Found buyer user:', data.user.email);
        
        // Load profile immediately and wait for it
        await loadUserProfile(data.user);
        
        return { 
          success: true, 
          user_type: 'buyer'
        };
      }

      // If we get here, no valid user found
      console.log('❌ [AuthContext] No valid user found for:', email);
      return { success: false, error: 'Invalid credentials' };

    } catch (error) {
      console.error('❌ [AuthContext] Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, userData, userType = 'buyer') => {
    try {
      setLoading(true);

      console.log('📝 [AuthContext] Starting signup:', { email, userType });

      // Check if user already exists and is rejected
      if (userType === 'seller') {
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id, seller_status, email')
          .eq('email', email)
          .single();

        if (existingProfile && existingProfile.seller_status === 'rejected') {
          console.log('🔄 [AuthContext] Found rejected seller, allowing reapplication:', existingProfile);
          
          // Allow rejected sellers to reapply by updating their profile
          const updatedProfile = {
            id: existingProfile.id,
            email: email,
            user_type: userType,
            display_name: userData?.displayName || userData?.storeName || email.split('@')[0],
            phone: userData?.contact || userData?.phone || null,
            address: userData?.storeAddress || userData?.address || null,
            business_name: userData?.storeName || null,
            business_description: userData?.businessInfo || null,
            business_address: userData?.storeAddress || null,
            seller_status: 'pending',
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: updateError } = await supabase
            .from('user_profiles')
            .update(updatedProfile)
            .eq('id', existingProfile.id);

          if (updateError) {
            console.error('❌ [AuthContext] Failed to update rejected seller profile:', updateError);
            throw new Error('Failed to update your application. Please try again.');
          }

          console.log('✅ [AuthContext] Rejected seller profile updated for reapplication');
          
          // Return success but indicate they need to use existing password
          return {
            success: true,
            user: {
              id: existingProfile.id,
              email: email,
              user_type: userType,
            },
            message: 'Your application has been updated! Please use your existing password to log in.'
          };
        }
      }

      // 1) Register auth user with minimal metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { user_type: userType } }
      });

      if (error) {
        console.error('❌ [AuthContext] Signup auth error:', error);
        
        // Handle specific error cases
        if (error.message?.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please try logging in instead.');
        }
        
        throw error;
      }

      if (data.user) {
        console.log('✅ [AuthContext] Auth user created:', data.user.id);
        
        // 2) Insert profile into correct table based on user type
        try {
          // Choose correct table: buyer_users for buyers, user_profiles for sellers
          const tableName = userType === 'buyer' ? 'buyer_users' : 'user_profiles';
          
          const profile = {
            id: data.user.id,
            email: data.user.email,
            user_type: userType,
          };

          if (userType === 'seller') {
            // Seller goes to user_profiles - ONLY business fields (no first_name, last_name)
            Object.assign(profile, {
              display_name: userData?.displayName || userData?.storeName || email.split('@')[0],
              phone: userData?.contact || userData?.phone || null,
              address: userData?.storeAddress || userData?.address || null,
              business_name: userData?.storeName || null,
              business_description: userData?.businessInfo || null,
              business_address: userData?.storeAddress || null,
              id_type: userData?.idType || null,
              id_front_url: userData?.idFrontUrl || null,
              id_back_url: userData?.idBackUrl || null,
              seller_status: 'pending',
              submitted_at: new Date().toISOString(),
            });
          } else {
            // Buyer goes to buyer_users - personal info fields
            Object.assign(profile, {
              first_name: userData?.firstName || userData?.first_name || '',
              last_name: userData?.lastName || userData?.last_name || '',
              middle_name: userData?.middleName || userData?.middle_name || null,
              phone: userData?.contact || userData?.phone || null,
              address: userData?.address || null,
            });
          }

          console.log(`📊 [AuthContext] Inserting into ${tableName}:`, profile);

          const { error: insertErr } = await supabase
            .from(tableName)
            .upsert(profile, { onConflict: 'id' });
          
          if (insertErr) {
            console.error(`❌ [AuthContext] ${tableName} insert error:`, insertErr);
            
            // Check for duplicate email error
            if (insertErr.message?.includes('duplicate key value violates unique constraint') && 
                insertErr.message?.includes('email')) {
              throw new Error('An account with this email already exists. Please use a different email or try logging in.');
            }
            
            // Provide detailed error message
            let errorMsg = 'Database error saving new user. ';
            
            if (insertErr.message?.includes('permission denied')) {
              errorMsg += 'Please run COMPLETE_USER_FLOW_SETUP.sql in Supabase first to set up permissions.';
            } else if (insertErr.message?.includes('relation') && insertErr.message?.includes('does not exist')) {
              errorMsg += `Table "${tableName}" does not exist. Please run COMPLETE_USER_FLOW_SETUP.sql in Supabase.`;
            } else if (insertErr.message?.includes('violates row-level security')) {
              errorMsg += 'Row Level Security is blocking the insert. Please run COMPLETE_USER_FLOW_SETUP.sql to fix policies.';
            } else {
              errorMsg += insertErr.message;
            }
            
            throw new Error(errorMsg);
          }

          console.log(`✅ [AuthContext] Profile created in ${tableName}`);
        } catch (e) {
          console.error('❌ [AuthContext] Profile creation failed:', e);
          // Delete the auth user if profile creation fails to avoid orphaned accounts
          try {
            await supabase.auth.admin.deleteUser(data.user.id);
            console.log('🗑️ [AuthContext] Cleaned up auth user due to profile creation failure');
          } catch (cleanupErr) {
            console.error('⚠️ [AuthContext] Could not cleanup auth user:', cleanupErr);
          }
          throw e;
        }

        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            user_type: userType,
          }
        };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error) {
      console.error('❌ [AuthContext] Signup error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 [AuthContext] Starting logout process...');
      setIsLoggingOut(true);
      
      // Clear all session data from localStorage
      localStorage.removeItem('admin_session');
      localStorage.removeItem('admin_session_token');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-msaeanvstzgrzphslcjz-auth-token');
      console.log('🗑️ [AuthContext] Cleared all localStorage data');
      
      // Clear sessionStorage
      sessionStorage.clear();
      console.log('🗑️ [AuthContext] Cleared all sessionStorage data');
      
      // Clear user state
      setUser(null);
      setLoading(false);
      setIsLoggingOut(false);
      console.log('✅ [AuthContext] User state cleared - logout complete');
      
      return { success: true };
    } catch (error) {
      console.error('❌ [AuthContext] Logout error:', error);
      // Even if there's an error, clear the user state
      setUser(null);
      setLoading(false);
      setIsLoggingOut(false);
      return { success: true };
    }
  };

  const updateProfile = async (updateData) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Update local user state
      setUser({ ...user, ...updateData });
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }
  };

  const verifyEmail = async (token) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Verify email error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    changePassword,
    resetPassword,
    verifyEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};