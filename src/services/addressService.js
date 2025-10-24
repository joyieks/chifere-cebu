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
      // Validate userId before making query
      if (!userId || userId === 'undefined' || userId === 'null') {
        console.warn('AddressService: Invalid userId provided:', userId);
        return { success: true, data: [] };
      }

      const tableName = 'buyer_addresses'; // Use buyer_addresses for all users for now
      
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
      // Validate userId before making query
      if (!userId || userId === 'undefined' || userId === 'null') {
        console.warn('AddressService: Invalid userId provided for default address:', userId);
        return { success: true, data: null };
      }

      const tableName = 'buyer_addresses'; // Use buyer_addresses for all users for now
      
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
        success: true,
        data: null
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
  async addAddress(addressData, role = 'buyer') {
    try {
      // Validate addressData parameter
      if (!addressData || typeof addressData !== 'object') {
        console.error('❌ [AddressService] Invalid addressData:', addressData);
        throw new Error('Address data is required');
      }

      // Get user ID from auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ [AddressService] Auth error:', authError);
        throw new Error('User not authenticated');
      }
      
      const userId = user.id;
      console.log('🏠 [AddressService] Adding address for user:', userId);
      console.log('🏠 [AddressService] Address data received:', addressData);
      
      const tableName = 'buyer_addresses'; // Use buyer_addresses for all users for now
      
      // If this is set as default, unset other default addresses
      if (addressData.isDefault) {
        await this.unsetDefaultAddresses(userId, role);
      }

      // Build address object with comprehensive field support
      const streetAddress = addressData.address || addressData.street_address || '';
      
      const address = {
        user_id: userId,
        name: addressData.name || addressData.recipient_name || 'Default Name',
        phone: addressData.phone || addressData.phone_number || '',
        address: streetAddress, // Simple address field
        address_line_1: streetAddress, // Keep for compatibility
        city: addressData.city || '',
        province: addressData.province || '',
        postal_code: addressData.postal_code || addressData.zip_code || '',
        is_default: addressData.isDefault || false
      };

      // Add optional fields only if they exist in the table
      if (addressData.type) address.type = addressData.type;
      if (addressData.barangay) address.barangay = addressData.barangay;
      if (addressData.country) address.country = addressData.country;
      if (addressData.lat) address.lat = addressData.lat;
      if (addressData.lng) address.lng = addressData.lng;
      if (addressData.isConfirmed !== undefined) address.is_confirmed = addressData.isConfirmed;
      if (addressData.isActive !== undefined) address.is_active = addressData.isActive;

      console.log('🏠 [AddressService] Adding address to table:', tableName);
      console.log('🏠 [AddressService] Address data:', address);

      // Validate required fields
      if (!address.name || address.name.trim() === '') {
        throw new Error('Name is required for address');
      }
      if (!streetAddress || streetAddress.trim() === '') {
        throw new Error('Street address is required');
      }

      const { data, error } = await supabase
        .from(tableName)
        .insert([address])
        .select()
        .single();

      if (error) {
        console.error('🏠 [AddressService] Supabase error:', error);
        throw error;
      }

      console.log('✅ [AddressService] Address added successfully:', data);

      return {
        success: true,
        data: data,
        message: 'Address added successfully'
      };
    } catch (error) {
      console.error('❌ [AddressService] Add address error:', error);
      
      // Return a more user-friendly error message
      let errorMessage = 'Failed to add address';
      if (error.message?.includes('User not authenticated')) {
        errorMessage = 'Please log in to add an address.';
      } else if (error.message?.includes('seller_addresses')) {
        errorMessage = 'Address table not found. Please contact support.';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'You do not have permission to add addresses.';
      } else if (error.message?.includes('PGRST205')) {
        errorMessage = 'Database table not found. Please contact support.';
      } else if (error.message?.includes('Cannot read properties of undefined')) {
        errorMessage = 'Authentication error. Please refresh the page and try again.';
      }
      
      return {
        success: false,
        error: errorMessage
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
      const tableName = 'buyer_addresses'; // Use buyer_addresses for all users for now
      
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
      const tableName = 'buyer_addresses'; // Use buyer_addresses for all users for now
      
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
      const tableName = 'buyer_addresses'; // Use buyer_addresses for all users for now
      
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
    const tableName = 'buyer_addresses'; // Use buyer_addresses for all users for now
    
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
      const tableName = 'buyer_addresses'; // Use buyer_addresses for all users for now
      
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