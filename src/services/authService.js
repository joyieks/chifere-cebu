import { supabase, handleSupabaseError } from '../config/supabase';

class AuthService {
  // Register new user
  async register(email, password, userData) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: userData.displayName || `${userData.firstName} ${userData.lastName}`,
            first_name: userData.firstName,
            last_name: userData.lastName,
            user_type: userData.userType,
          },
        },
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error('Failed to create user');

      // Determine table based on user type
      const tableName = userData.userType === 'seller' ? 'seller_users' : 'buyer_users';

      // Create base user document
      const baseUserData = {
        id: user.id,
        email: user.email,
        display_name: userData.displayName || `${userData.firstName} ${userData.lastName}`,
        first_name: userData.firstName,
        last_name: userData.lastName,
        user_type: userData.userType, // 'buyer' or 'seller'
        phone: userData.phone || '',
        address: userData.address || '',
        is_verified: false,
        profile_image: userData.profileImage || '',
      };

      // Add seller-specific fields if registering as seller
      if (userData.userType === 'seller') {
        baseUserData.business_name = userData.businessName || '';
        baseUserData.business_description = userData.businessDescription || '';
        baseUserData.business_category = userData.businessCategory || '';
        baseUserData.business_address = userData.businessAddress || '';
        baseUserData.business_phone = userData.businessPhone || '';
        baseUserData.business_email = userData.businessEmail || '';
        baseUserData.is_business_verified = false;
        baseUserData.kyc_status = 'none'; // 'none' | 'pending' | 'approved' | 'rejected'
        baseUserData.kyc_documents = {};
        baseUserData.kyc_submitted_at = null;
        baseUserData.kyc_reviewed_at = null;
        baseUserData.rating = 0;
        baseUserData.total_sales = 0;
        baseUserData.total_items = 0;
      }

      // Insert user document into appropriate table
      const { error: insertError } = await supabase
        .from(tableName)
        .insert([baseUserData]);

      if (insertError) throw insertError;

      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);

      // Map Supabase errors to user-friendly messages
      let friendlyMessage = error.message;

      if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
        friendlyMessage = 'This email is already registered. Please use a different email or try logging in.';
      } else if (error.message?.includes('invalid email')) {
        friendlyMessage = 'Invalid email address format.';
      } else if (error.message?.includes('Password should be')) {
        friendlyMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (error.message?.includes('network')) {
        friendlyMessage = 'Network error. Please check your internet connection.';
      } else {
        friendlyMessage = 'Registration failed. Please try again.';
      }

      return { success: false, error: friendlyMessage, code: error.code };
    }
  }

  // Login user
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);

      // Map Supabase errors to user-friendly messages
      let friendlyMessage = error.message;

      if (error.message?.includes('Invalid login credentials')) {
        friendlyMessage = 'Incorrect email or password. Please check your credentials and try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        friendlyMessage = 'Please verify your email address before logging in.';
      } else if (error.message?.includes('invalid email')) {
        friendlyMessage = 'Invalid email address format.';
      } else if (error.message?.includes('network')) {
        friendlyMessage = 'Network error. Please check your internet connection.';
      } else {
        friendlyMessage = 'Login failed. Please check your credentials and try again.';
      }

      return { success: false, error: friendlyMessage, code: error.code };
    }
  }

  // Logout user
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current user
  getCurrentUser() {
    return supabase.auth.getUser().then(({ data }) => data.user);
  }

  // Listen to auth state changes
  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
    return subscription.unsubscribe;
  }

  // Get user profile from Supabase
  async getUserProfile(uid) {
    try {
      // Check if user is authenticated first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Try buyer table first
      let { data: userData, error: buyerError } = await supabase
        .from('buyer_users')
        .select('*')
        .eq('id', uid)
        .single();

      if (!buyerError && userData) {
        return {
          success: true,
          data: {
            ...userData,
            userType: 'buyer',
            collection: 'buyer_users',
            // Convert snake_case to camelCase for compatibility
            displayName: userData.display_name,
            firstName: userData.first_name,
            lastName: userData.last_name,
            isVerified: userData.is_verified,
            profileImage: userData.profile_image,
          }
        };
      }

      // Try seller table
      ({ data: userData, error: buyerError } = await supabase
        .from('seller_users')
        .select('*')
        .eq('id', uid)
        .single());

      if (!buyerError && userData) {
        return {
          success: true,
          data: {
            ...userData,
            userType: 'seller',
            collection: 'seller_users',
            // Convert snake_case to camelCase for compatibility
            displayName: userData.display_name,
            firstName: userData.first_name,
            lastName: userData.last_name,
            isVerified: userData.is_verified,
            profileImage: userData.profile_image,
            businessName: userData.business_name,
            businessDescription: userData.business_description,
            businessCategory: userData.business_category,
            businessAddress: userData.business_address,
            businessPhone: userData.business_phone,
            businessEmail: userData.business_email,
            isBusinessVerified: userData.is_business_verified,
            kycStatus: userData.kyc_status,
            kycDocuments: userData.kyc_documents,
            kycSubmittedAt: userData.kyc_submitted_at,
            kycReviewedAt: userData.kyc_reviewed_at,
            totalSales: userData.total_sales,
            totalItems: userData.total_items,
          }
        };
      }

      return { success: false, error: 'User profile not found' };
    } catch (error) {
      console.error('Get user profile error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Update user profile
  async updateUserProfile(uid, updates) {
    try {
      // Convert camelCase to snake_case for Supabase
      const snakeCaseUpdates = {};
      for (const [key, value] of Object.entries(updates)) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        snakeCaseUpdates[snakeKey] = value;
      }
      snakeCaseUpdates.updated_at = new Date().toISOString();

      // Check buyer table first
      const { data: buyerData } = await supabase
        .from('buyer_users')
        .select('id')
        .eq('id', uid)
        .single();

      let collectionName = buyerData ? 'buyer_users' : null;

      if (!collectionName) {
        // Check seller table
        const { data: sellerData } = await supabase
          .from('seller_users')
          .select('id')
          .eq('id', uid)
          .single();

        collectionName = sellerData ? 'seller_users' : null;
      }

      if (!collectionName) {
        return { success: false, error: 'User profile not found' };
      }

      const { error } = await supabase
        .from(collectionName)
        .update(snakeCaseUpdates)
        .eq('id', uid);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Update user profile error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      // Re-authenticate user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) throw new Error('Current password is incorrect');

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  }

  // Get user type (buyer/seller)
  async getUserType(uid) {
    try {
      const profileResult = await this.getUserProfile(uid);
      if (profileResult.success) {
        return profileResult.data.userType;
      }
      return null;
    } catch (error) {
      console.error('Get user type error:', error);
      return null;
    }
  }

  // Upgrade buyer to seller (create seller account while keeping buyer account)
  async upgradeBuyerToSeller(uid, sellerData) {
    try {
      // Check if user is currently a buyer
      const { data: buyerProfile, error: buyerError } = await supabase
        .from('buyer_users')
        .select('*')
        .eq('id', uid)
        .single();

      if (buyerError || !buyerProfile) {
        return { success: false, error: 'Buyer account not found' };
      }

      // Create seller profile with KYC fields
      const sellerProfile = {
        id: uid,
        email: buyerProfile.email,
        display_name: buyerProfile.display_name,
        first_name: buyerProfile.first_name,
        last_name: buyerProfile.last_name,
        user_type: 'seller',
        phone: sellerData.phone || buyerProfile.phone,
        address: sellerData.address || buyerProfile.address,
        profile_image: buyerProfile.profile_image,
        is_verified: false,
        business_name: sellerData.businessName || '',
        business_description: sellerData.businessDescription || '',
        business_category: sellerData.businessCategory || '',
        business_address: sellerData.businessAddress || '',
        business_phone: sellerData.businessPhone || '',
        business_email: sellerData.businessEmail || buyerProfile.email,
        is_business_verified: false,
        kyc_status: 'pending',
        kyc_documents: {},
        kyc_submitted_at: null,
        kyc_reviewed_at: null,
        rating: 0,
        total_sales: 0,
        total_items: 0,
      };

      const { error } = await supabase
        .from('seller_users')
        .insert([sellerProfile]);

      if (error) throw error;

      return { success: true, data: sellerProfile };
    } catch (error) {
      console.error('Upgrade buyer to seller error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }
}

export default new AuthService();
