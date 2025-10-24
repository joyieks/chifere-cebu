/**
 * Admin Context
 * 
 * Provides admin authentication and state management
 * for the admin dashboard and seller approval system.
 * 
 * Features:
 * - Admin login/logout
 * - Session management
 * - Admin state persistence
 * - Seller approval/rejection
 * 
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import adminService from '../services/adminService';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  /**
   * Check for existing admin session
   */
  const checkSession = async () => {
    try {
      const sessionToken = localStorage.getItem('admin_session_token');
      if (!sessionToken) {
        setLoading(false);
        return;
      }

      const result = await adminService.validateSession(sessionToken);
      if (result.success) {
        setAdmin(result.admin);
      } else {
        localStorage.removeItem('admin_session_token');
      }
    } catch (error) {
      console.error('Session check error:', error);
      localStorage.removeItem('admin_session_token');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Admin login
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @returns {Promise<Object>} - Login result
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const result = await adminService.login(email, password);
      if (result.success) {
        setAdmin(result.admin);
        localStorage.setItem('admin_session_token', result.sessionToken);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Admin logout
   * @returns {Promise<Object>} - Logout result
   */
  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem('admin_session_token');
      if (sessionToken) {
        await adminService.logout(sessionToken);
      }
    } catch (error) {
      console.error('Admin logout error:', error);
    } finally {
      setAdmin(null);
      localStorage.removeItem('admin_session_token');
    }
  };

  /**
   * Approve seller
   * @param {string} sellerId - Seller ID
   * @returns {Promise<Object>} - Approval result
   */
  const approveSeller = async (sellerId) => {
    try {
      if (!admin) {
        return { success: false, error: 'Admin not authenticated' };
      }

      const result = await adminService.approveSeller(sellerId, admin.id);
      return result;
    } catch (error) {
      console.error('Approve seller error:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Reject seller
   * @param {string} sellerId - Seller ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} - Rejection result
   */
  const rejectSeller = async (sellerId, reason) => {
    try {
      if (!admin) {
        return { success: false, error: 'Admin not authenticated' };
      }

      const result = await adminService.rejectSeller(sellerId, admin.id, reason);
      return result;
    } catch (error) {
      console.error('Reject seller error:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Get pending sellers
   * @returns {Promise<Object>} - Pending sellers result
   */
  const getPendingSellers = async () => {
    try {
      return await adminService.getPendingSellers();
    } catch (error) {
      console.error('Get pending sellers error:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Get all sellers
   * @returns {Promise<Object>} - All sellers result
   */
  const getAllSellers = async () => {
    try {
      return await adminService.getAllSellers();
    } catch (error) {
      console.error('Get all sellers error:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Get dashboard statistics
   * @returns {Promise<Object>} - Dashboard stats result
   */
  const getDashboardStats = async () => {
    try {
      return await adminService.getDashboardStats();
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    admin,
    loading,
    error,
    login,
    logout,
    approveSeller,
    rejectSeller,
    getPendingSellers,
    getAllSellers,
    getDashboardStats,
    isAuthenticated: !!admin
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext;



