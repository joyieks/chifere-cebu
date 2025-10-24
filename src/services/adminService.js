/**
 * Admin Service
 * 
 * Handles admin operations including seller approval/rejection,
 * admin authentication, and admin dashboard data.
 * 
 * Features:
 * - Admin login/logout
 * - Get pending sellers
 * - Approve/reject sellers
 * - Admin activity logging
 * - Dashboard statistics
 * 
 * @version 1.0.0
 */

import { supabase } from '../config/supabase';

class AdminService {
  /**
   * Admin login
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @returns {Promise<Object>} - Login result
   */
  async login(email, password) {
    try {
      // Hash password (simple SHA-256 for demo - use bcrypt in production)
      const hashedPassword = await this.hashPassword(password);
      
      // Check admin credentials
      const { data: admin, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', hashedPassword)
        .eq('is_active', true)
        .single();

      if (error || !admin) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Create session
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const { error: sessionError } = await supabase
        .from('admin_sessions')
        .insert({
          admin_id: admin.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString()
        });

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        return { success: false, error: 'Failed to create session' };
      }

      // Update last login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', admin.id);

      // Log login activity
      await this.logActivity(admin.id, 'login', 'Admin logged in');

      return {
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.first_name,
          lastName: admin.last_name,
          role: admin.role
        },
        sessionToken
      };
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate admin session
   * @param {string} sessionToken - Session token
   * @returns {Promise<Object>} - Validation result
   */
  async validateSession(sessionToken) {
    try {
      const { data: session, error } = await supabase
        .from('admin_sessions')
        .select(`
          *,
          admin_users (
            id,
            email,
            first_name,
            last_name,
            role,
            is_active
          )
        `)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !session || !session.admin_users) {
        return { success: false, error: 'Invalid or expired session' };
      }

      // Update last accessed
      await supabase
        .from('admin_sessions')
        .update({ last_accessed: new Date().toISOString() })
        .eq('id', session.id);

      return {
        success: true,
        admin: {
          id: session.admin_users.id,
          email: session.admin_users.email,
          firstName: session.admin_users.first_name,
          lastName: session.admin_users.last_name,
          role: session.admin_users.role
        }
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pending sellers
   * @returns {Promise<Object>} - Pending sellers list
   */
  async getPendingSellers() {
    try {
      const { data: sellers, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_type', 'seller')
        .eq('seller_status', 'pending')
        .order('submitted_at', { ascending: true });

      if (error) {
        console.error('Get pending sellers error:', error);
        return { success: false, error: 'Failed to fetch pending sellers' };
      }

      return { success: true, sellers: sellers || [] };
    } catch (error) {
      console.error('Get pending sellers error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all sellers with their status
   * @returns {Promise<Object>} - All sellers list
   */
  async getAllSellers() {
    try {
      const { data: sellers, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_type', 'seller')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get all sellers error:', error);
        return { success: false, error: 'Failed to fetch sellers' };
      }

      return { success: true, sellers: sellers || [] };
    } catch (error) {
      console.error('Get all sellers error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all buyers
   * @returns {Promise<Object>} - All buyers list
   */
  async getAllBuyers() {
    try {
      const { data: buyers, error } = await supabase
        .from('buyer_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get all buyers error:', error);
        return { success: false, error: 'Failed to fetch buyers' };
      }

      return { success: true, buyers: buyers || [] };
    } catch (error) {
      console.error('Get all buyers error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all users (sellers and buyers)
   * @returns {Promise<Object>} - All users list
   */
  async getAllUsers() {
    try {
      // Fetch sellers from user_profiles table
      const { data: sellers, error: sellersError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (sellersError) {
        console.error('Get sellers error:', sellersError);
        return { success: false, error: 'Failed to fetch sellers' };
      }

      // Fetch buyers from buyer_users table
      const { data: buyers, error: buyersError } = await supabase
        .from('buyer_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (buyersError) {
        console.error('Get buyers error:', buyersError);
        return { success: false, error: 'Failed to fetch buyers' };
      }

      // Combine both arrays and sort by created_at
      const allUsers = [...(sellers || []), ...(buyers || [])]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return { success: true, users: allUsers };
    } catch (error) {
      console.error('Get all users error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Approve seller
   * @param {string} sellerId - Seller ID
   * @param {string} adminId - Admin ID
   * @returns {Promise<Object>} - Approval result
   */
  async approveSeller(sellerId, adminId) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          seller_status: 'approved',
          verified_at: new Date().toISOString(),
          verified_by: adminId
        })
        .eq('id', sellerId);

      if (error) {
        console.error('Approve seller error:', error);
        return { success: false, error: 'Failed to approve seller' };
      }

      // Log activity
      await this.logActivity(adminId, 'approve_seller', `Approved seller ${sellerId}`, 'seller', sellerId);

      return { success: true };
    } catch (error) {
      console.error('Approve seller error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject seller
   * @param {string} sellerId - Seller ID
   * @param {string} adminId - Admin ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} - Rejection result
   */
  async rejectSeller(sellerId, adminId, reason) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          seller_status: 'rejected',
          rejection_reason: reason,
          verified_at: new Date().toISOString(),
          verified_by: adminId
        })
        .eq('id', sellerId);

      if (error) {
        console.error('Reject seller error:', error);
        return { success: false, error: 'Failed to reject seller' };
      }

      // Log activity
      await this.logActivity(adminId, 'reject_seller', `Rejected seller ${sellerId}: ${reason}`, 'seller', sellerId);

      return { success: true };
    } catch (error) {
      console.error('Reject seller error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get admin dashboard statistics
   * @returns {Promise<Object>} - Dashboard stats
   */
  async getDashboardStats() {
    try {
      // Get pending sellers count
      const { count: pendingCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'seller')
        .eq('seller_status', 'pending');

      // Get approved sellers count
      const { count: approvedCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'seller')
        .eq('seller_status', 'approved');

      // Get rejected sellers count
      const { count: rejectedCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'seller')
        .eq('seller_status', 'rejected');

      // Get total buyers count
      const { count: buyersCount } = await supabase
        .from('buyer_users')
        .select('*', { count: 'exact', head: true });

      // Get recent activities
      const { data: recentActivities } = await supabase
        .from('admin_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        success: true,
        stats: {
          pendingSellers: pendingCount || 0,
          approvedSellers: approvedCount || 0,
          rejectedSellers: rejectedCount || 0,
          totalBuyers: buyersCount || 0,
          recentActivities: recentActivities || []
        }
      };
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Disable user account
   * @param {string} userId - User ID
   * @param {string} adminId - Admin ID
   * @param {string} reason - Reason for disabling
   * @returns {Promise<Object>} - Disable result
   */
  async disableUser(userId, adminId, reason = 'Account disabled by admin') {
    try {
      // Try to disable in user_profiles first (sellers)
      let { data: sellerData, error: sellerError } = await supabase
        .from('user_profiles')
        .update({
          is_active: false,
          disabled_at: new Date().toISOString(),
          disabled_reason: reason
          // Note: Not setting disabled_by to avoid foreign key constraint issues
        })
        .eq('id', userId)
        .select();

      // If not found in user_profiles, try buyer_users table
      if (sellerError && sellerError.code === 'PGRST116') { // No rows found
        const { data: buyerData, error: buyerError } = await supabase
          .from('buyer_users')
          .update({
            is_active: false,
            disabled_at: new Date().toISOString(),
            disabled_reason: reason
            // Note: Not setting disabled_by to avoid foreign key constraint issues
          })
          .eq('id', userId)
          .select();
        
        if (buyerError) {
          console.error('Disable user error:', buyerError);
          return { success: false, error: 'Failed to disable user' };
        }
      } else if (sellerError) {
        console.error('Disable user error:', sellerError);
        return { success: false, error: 'Failed to disable user' };
      }

      // Log activity (this will still work as it uses admin_sessions table)
      try {
        await this.logActivity(adminId, 'disable_user', `Disabled user ${userId}: ${reason}`, 'user', userId);
      } catch (logError) {
        console.warn('Failed to log activity:', logError);
        // Don't fail the main operation if logging fails
      }

      return { success: true };
    } catch (error) {
      console.error('Disable user error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enable user account
   * @param {string} userId - User ID
   * @param {string} adminId - Admin ID
   * @returns {Promise<Object>} - Enable result
   */
  async enableUser(userId, adminId) {
    try {
      // Try to enable in user_profiles first (sellers)
      let { error } = await supabase
        .from('user_profiles')
        .update({
          is_active: true,
          disabled_at: null,
          disabled_reason: null
          // Note: Not setting disabled_by to null to avoid foreign key constraint issues
        })
        .eq('id', userId);

      // If not found in user_profiles, try buyer_users table
      if (error && error.code === 'PGRST116') { // No rows found
        const { error: buyerError } = await supabase
          .from('buyer_users')
          .update({
            is_active: true,
            disabled_at: null,
            disabled_reason: null
            // Note: Not setting disabled_by to null to avoid foreign key constraint issues
          })
          .eq('id', userId);
        
        error = buyerError;
      }

      if (error) {
        console.error('Enable user error:', error);
        return { success: false, error: 'Failed to enable user' };
      }

      // Log activity
      try {
        await this.logActivity(adminId, 'enable_user', `Enabled user ${userId}`, 'user', userId);
      } catch (logError) {
        console.warn('Failed to log activity:', logError);
        // Don't fail the main operation if logging fails
      }

      return { success: true };
    } catch (error) {
      console.error('Enable user error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recent admin activities
   * @returns {Promise<Object>} - Recent activities
   */
  async getRecentActivities() {
    try {
      const { data: activities, error } = await supabase
        .from('admin_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Get recent activities error:', error);
        return { success: false, error: 'Failed to fetch recent activities' };
      }

      return { success: true, activities: activities || [] };
    } catch (error) {
      console.error('Get recent activities error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log admin activity
   * @param {string} adminId - Admin ID
   * @param {string} action - Action performed
   * @param {string} description - Action description
   * @param {string} targetType - Target type (optional)
   * @param {string} targetId - Target ID (optional)
   * @returns {Promise<void>}
   */
  async logActivity(adminId, action, description, targetType = null, targetId = null) {
    try {
      await supabase
        .from('admin_activities')
        .insert({
          admin_id: adminId,
          action,
          description,
          target_type: targetType,
          target_id: targetId,
          ip_address: null, // Could be added from request
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Log activity error:', error);
    }
  }

  /**
   * Hash password (simple SHA-256 for demo)
   * @param {string} password - Plain password
   * @returns {Promise<string>} - Hashed password
   */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate session token
   * @returns {string} - Session token
   */
  generateSessionToken() {
    return 'admin_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  }

  /**
   * Logout admin
   * @param {string} sessionToken - Session token
   * @returns {Promise<Object>} - Logout result
   */
  async logout(sessionToken) {
    try {
      const { error } = await supabase
        .from('admin_sessions')
        .delete()
        .eq('session_token', sessionToken);

      if (error) {
        console.error('Logout error:', error);
        return { success: false, error: 'Failed to logout' };
      }

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new AdminService();


