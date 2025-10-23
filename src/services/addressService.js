/**
 * Address Service
 *
 * Handles address management for buyers with Supabase integration.
 * Provides CRUD operations for addresses and default address management.
 *
 * Features:
 * - CRUD operations for addresses
 * - Default address management
 * - Address validation
 * - Integration with checkout
 *
 * @version 2.0.0 - Supabase integration
 */

import { supabase, handleSupabaseError } from '../config/supabase';

class AddressService {
  /**
   * Get all addresses for a user
   * @param {string} userId - User ID
   * @param {string} role - User role (buyer/seller)
   * @returns {Promise<Object>} - User addresses
   */
  async getAddresses(userId, role = 'buyer') {
    try {
      const tableName = role === 'buyer' ? 'buyer_addresses' : 'seller_addresses';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      // Handle any database errors gracefully
      if (error) {
        console.warn(`Address error (${tableName}):`, error.message);
        return { success: true, data: [] };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Get user addresses error:', error);
      // Always return success with empty array to prevent app crashes
      return {
        success: true,
        data: []
      };
    }
  }

  /**
   * Get default address for a user
   * @param {string} userId - User ID
   * @param {string} role - User role (buyer/seller)
   * @returns {Promise<Object>} - Default address
   */
  async getDefaultAddress(userId, role = 'buyer') {
    try {
      const tableName = role === 'buyer' ? 'buyer_addresses' : 'seller_addresses';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return {
        success: true,
        data: data || null
      };
    } catch (error) {
      console.error('Get default address error:', error);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Add a new address
   * @param {string} userId - User ID
   * @param {Object} addressData - Address data
   * @param {string} role - User role (buyer/seller)
   * @returns {Promise<Object>} - Result
   */
  async addAddress(userId, addressData, role = 'buyer') {
    try {
      const tableName = role === 'buyer' ? 'buyer_addresses' : 'seller_addresses';
      
      // If this is set as default, unset other default addresses
      if (addressData.isDefault) {
        await this.unsetDefaultAddresses(userId, role);
      }

      const address = {
        user_id: userId,
        type: addressData.type || 'home',
        name: addressData.name || addressData.recipient_name,
        phone: addressData.phone || addressData.phone_number,
        address_line_1: addressData.address_line_1 || addressData.street_address,
        address_line_2: addressData.address_line_2 || '',
        barangay: addressData.barangay,
        city: addressData.city,
        province: addressData.province,
        zip_code: addressData.zip_code,
        country: addressData.country || 'Philippines',
        is_default: addressData.isDefault || false,
        is_active: true,
        lat: addressData.lat || null,
        lng: addressData.lng || null,
        is_confirmed: addressData.isConfirmed || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(tableName)
        .insert([address])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data,
        message: 'Address added successfully'
      };
    } catch (error) {
      console.error('Add address error:', error);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Update an address
   * @param {string} addressId - Address ID
   * @param {Object} addressData - Updated address data
   * @param {string} role - User role (buyer/seller)
   * @returns {Promise<Object>} - Result
   */
  async updateAddress(addressId, addressData, role = 'buyer') {
    try {
      const tableName = role === 'buyer' ? 'buyer_addresses' : 'seller_addresses';
      
      // If this is set as default, unset other default addresses
      if (addressData.isDefault) {
        const { data: address } = await supabase
          .from(tableName)
          .select('user_id')
          .eq('id', addressId)
          .single();
        
        if (address) {
          await this.unsetDefaultAddresses(address.user_id, role);
        }
      }

      const updateData = {
        type: addressData.type,
        name: addressData.name || addressData.recipient_name,
        phone: addressData.phone || addressData.phone_number,
        address_line_1: addressData.address_line_1 || addressData.street_address,
        address_line_2: addressData.address_line_2 || '',
        barangay: addressData.barangay,
        city: addressData.city,
        province: addressData.province,
        zip_code: addressData.zip_code,
        country: addressData.country,
        is_default: addressData.isDefault,
        lat: addressData.lat,
        lng: addressData.lng,
        is_confirmed: addressData.isConfirmed,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', addressId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data,
        message: 'Address updated successfully'
      };
    } catch (error) {
      console.error('Update address error:', error);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Delete an address
   * @param {string} addressId - Address ID
   * @param {string} role - User role (buyer/seller)
   * @returns {Promise<Object>} - Result
   */
  async deleteAddress(addressId, role = 'buyer') {
    try {
      const tableName = role === 'buyer' ? 'buyer_addresses' : 'seller_addresses';
      
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from(tableName)
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', addressId);

      if (error) throw error;

      return {
        success: true,
        message: 'Address deleted successfully'
      };
    } catch (error) {
      console.error('Delete address error:', error);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Set an address as default
   * @param {string} addressId - Address ID
   * @param {string} userId - User ID
   * @param {string} role - User role (buyer/seller)
   * @returns {Promise<Object>} - Result
   */
  async setDefaultAddress(addressId, userId, role = 'buyer') {
    try {
      const tableName = role === 'buyer' ? 'buyer_addresses' : 'seller_addresses';
      
      // First, unset all default addresses for this user
      await this.unsetDefaultAddresses(userId, role);

      // Set the specified address as default
      const { error } = await supabase
        .from(tableName)
        .update({ 
          is_default: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', addressId)
        .eq('user_id', userId);

      if (error) throw error;

      return {
        success: true,
        message: 'Default address updated successfully'
      };
    } catch (error) {
      console.error('Set default address error:', error);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Unset all default addresses for a user
   * @param {string} userId - User ID
   * @param {string} role - User role (buyer/seller)
   * @returns {Promise<void>}
   */
  async unsetDefaultAddresses(userId, role = 'buyer') {
    const tableName = role === 'buyer' ? 'buyer_addresses' : 'seller_addresses';
    
    await supabase
      .from(tableName)
      .update({ 
        is_default: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_default', true);
  }

  /**
   * Get address by ID
   * @param {string} addressId - Address ID
   * @param {string} role - User role (buyer/seller)
   * @returns {Promise<Object>} - Address
   */
  async getAddressById(addressId, role = 'buyer') {
    try {
      const tableName = role === 'buyer' ? 'buyer_addresses' : 'seller_addresses';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', addressId)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Get address by ID error:', error);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Validate address data
   * @param {Object} addressData - Address data
   * @returns {Object} - Validation result
   */
  validateAddress(addressData) {
    const errors = [];

    if (!addressData.name && !addressData.recipient_name) {
      errors.push('Recipient name is required');
    }
    if (!addressData.phone && !addressData.phone_number) {
      errors.push('Phone number is required');
    }
    if (!addressData.address_line_1 && !addressData.street_address) {
      errors.push('Street address is required');
    }
    if (!addressData.barangay) {
      errors.push('Barangay is required');
    }
    if (!addressData.city) {
      errors.push('City is required');
    }
    if (!addressData.province) {
      errors.push('Province is required');
    }
    if (!addressData.zip_code) {
      errors.push('ZIP code is required');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Format address for display
   * @param {Object} address - Address object
   * @returns {string} - Formatted address
   */
  formatAddress(address) {
    const parts = [
      address.address_line_1 || address.street_address,
      address.address_line_2,
      address.barangay,
      address.city,
      address.province,
      address.zip_code
    ].filter(Boolean);

    return parts.join(', ');
  }

  // Legacy method names for backward compatibility
  async getUserAddresses(userId, role = 'buyer') {
    return this.getAddresses(userId, role);
  }

  async createAddress(userId, addressData, role = 'buyer') {
    return this.addAddress(userId, addressData, role);
  }

  async updateAddressById(addressId, addressData, role = 'buyer') {
    return this.updateAddress(addressId, addressData, role);
  }

  async deleteAddressById(addressId, role = 'buyer') {
    return this.deleteAddress(addressId, role);
  }
}

export default new AddressService();