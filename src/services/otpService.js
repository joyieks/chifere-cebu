/**
 * OTP Service
 * 
 * Handles OTP (One-Time Password) operations with Supabase integration.
 * Provides OTP generation, verification, and management for user authentication.
 * 
 * Features:
 * - Generate and store OTPs in Supabase
 * - Verify OTP codes
 * - Handle OTP expiration and cleanup
 * - Integration with EmailJS for sending OTPs
 * 
 * @version 2.0.0 - Supabase integration
 */

import { supabase } from '../config/supabase';
import emailService from './emailService';

class OTPService {
  /**
   * Generate and send OTP for email verification
   * @param {string} email - Email address
   * @param {string} userType - User type (buyer/seller)
   * @param {string} purpose - Purpose of OTP (verification, password_reset, etc.)
   * @param {string} firstName - User's first name (optional)
   * @returns {Promise<Object>} - Result
   */
  async generateAndSendOTP(email, userType = 'buyer', purpose = 'verification', firstName = null) {
    try {
      console.log('🔍 [OTPService] generateAndSendOTP called with:', { email, userType, purpose, firstName });
      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('🔍 [OTPService] Generated OTP code:', otpCode);
      
      // Set expiration time (10 minutes from now)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      console.log('🔍 [OTPService] OTP expires at:', expiresAt);
      
      // Store OTP in Supabase
      const { data, error } = await supabase
        .from('otp_verifications')
        .insert([{
          email,
          otp_code: otpCode,
          user_type: userType,
          purpose,
          expires_at: expiresAt,
          is_used: false,
          attempts: 0
        }]);

      if (error) {
        console.error('❌ [OTPService] Error storing OTP in Supabase:', error);
        return { success: false, error: 'Failed to generate OTP' };
      }
      console.log('✅ [OTPService] OTP stored in Supabase successfully');

      // Send OTP via email
      console.log('🔍 [OTPService] Sending OTP via email...');
      const emailResult = await emailService.sendOTPVerification(email, otpCode, userType, firstName);
      console.log('🔍 [OTPService] Email result:', emailResult);
      
      if (emailResult.success) {
        console.log('✅ [OTPService] OTP sent successfully via email');
        return { 
          success: true, 
          message: 'OTP generated and sent successfully',
          otpId: data?.[0]?.id 
        };
      } else {
        // If email fails, still return success but log the issue
        console.warn('⚠️ [OTPService] OTP generated but email sending failed:', emailResult.error);
        return { 
          success: true, 
          message: 'OTP generated successfully (email may not have been sent)',
          otpId: data?.[0]?.id,
          warning: emailResult.error
        };
      }
    } catch (error) {
      console.error('❌ [OTPService] Error generating OTP:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify OTP code
   * @param {string} email - Email address
   * @param {string} code - OTP code to verify
   * @param {string} purpose - Purpose of OTP verification
   * @returns {Promise<Object>} - Result
   */
  async verifyOTP(email, code, purpose = 'verification') {
    try {
      // Get the most recent unused OTP for this email and purpose
      const { data: otpData, error: fetchError } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('email', email)
        .eq('purpose', purpose)
        .eq('is_used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !otpData) {
        return { success: false, error: 'No valid OTP found for this email' };
      }

      // Check if OTP has expired
      if (new Date() > new Date(otpData.expires_at)) {
        // Mark as used to prevent reuse
        await supabase
          .from('otp_verifications')
          .update({ is_used: true })
          .eq('id', otpData.id);
        
        return { success: false, error: 'OTP has expired' };
      }

      // Check attempt limit
      if (otpData.attempts >= 3) {
        // Mark as used to prevent further attempts
        await supabase
          .from('otp_verifications')
          .update({ is_used: true })
          .eq('id', otpData.id);
        
        return { success: false, error: 'Too many failed attempts. Please request a new OTP.' };
      }

      // Verify code
      if (otpData.otp_code === code) {
        // Mark OTP as used
        await supabase
          .from('otp_verifications')
          .update({ is_used: true, used_at: new Date().toISOString() })
          .eq('id', otpData.id);
        
        return { success: true, message: 'OTP verified successfully' };
      } else {
        // Increment attempts
        await supabase
          .from('otp_verifications')
          .update({ attempts: otpData.attempts + 1 })
          .eq('id', otpData.id);
        
        return { success: false, error: 'Invalid OTP code' };
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Resend OTP for email verification
   * @param {string} email - Email address
   * @param {string} userType - User type
   * @param {string} purpose - Purpose of OTP
   * @param {string} firstName - User's first name (optional)
   * @returns {Promise<Object>} - Result
   */
  async resendOTP(email, userType = 'buyer', purpose = 'verification', firstName = null) {
    try {
      // First, invalidate any existing unused OTPs for this email
      await supabase
        .from('otp_verifications')
        .update({ is_used: true })
        .eq('email', email)
        .eq('purpose', purpose)
        .eq('is_used', false);

      // Generate and send new OTP
      return await this.generateAndSendOTP(email, userType, purpose, firstName);
    } catch (error) {
      console.error('Error resending OTP:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean up expired OTPs
   * @returns {Promise<Object>} - Result
   */
  async cleanupExpiredOTPs() {
    try {
      const { error } = await supabase
        .from('otp_verifications')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error cleaning up expired OTPs:', error);
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Expired OTPs cleaned up successfully' };
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get OTP statistics for an email
   * @param {string} email - Email address
   * @returns {Promise<Object>} - Result with statistics
   */
  async getOTPStats(email) {
    try {
      const { data, error } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching OTP stats:', error);
        return { success: false, error: error.message };
      }

      const stats = {
        totalOTPs: data.length,
        usedOTPs: data.filter(otp => otp.is_used).length,
        expiredOTPs: data.filter(otp => new Date() > new Date(otp.expires_at)).length,
        recentOTPs: data.slice(0, 5) // Last 5 OTPs
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching OTP stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate email format
   * @param {string} email - Email address
   * @returns {boolean} - Validation result
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate a mock OTP for development/testing
   * @param {string} email - Email address
   * @returns {string} - Mock OTP code
   */
  generateMockOTP(email) {
    // Generate a predictable OTP based on email for testing
    const hash = email.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash).toString().padStart(6, '0').slice(-6);
  }
}

export default new OTPService();







