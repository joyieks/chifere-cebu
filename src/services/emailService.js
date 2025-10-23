/**
 * Email Service
 * 
 * Handles email operations using EmailJS for OTP verification and notifications.
 * Provides email sending functionality for user verification and system notifications.
 * 
 * Features:
 * - Send OTP verification emails
 * - Send password reset emails
 * - Send order confirmation emails
 * - Send notification emails
 * 
 * @version 2.0.0 - Supabase integration with EmailJS
 */

import emailjs from '@emailjs/browser';

class EmailService {
  constructor() {
    this.serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_8g95wi7';
    this.publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'vk4GtJc1VVqgKTtMp';
    this.templateIds = {
      otpVerification: 'template_m0g4pja',
      passwordReset: 'template_password_reset',
      orderConfirmation: 'template_order_confirmation',
      welcomeEmail: 'template_welcome_email',
      notification: 'template_notification'
    };
    
    // Initialize EmailJS
    if (this.publicKey && this.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY') {
      emailjs.init(this.publicKey);
    }
  }

  /**
   * Send OTP verification email
   * @param {string} email - Recipient email
   * @param {string} otpCode - OTP code
   * @param {string} userType - User type (buyer/seller)
   * @param {string} firstName - User's first name (optional)
   * @returns {Promise<Object>} - Result
   */
  async sendOTPVerification(email, otpCode, userType = 'buyer', firstName = null) {
    try {
      if (!this.publicKey || this.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
        console.warn('EmailJS not configured. Using mock OTP:', otpCode);
        return { success: true, message: 'OTP sent (mock mode)', otpCode };
      }

      // Extract first name from email if not provided
      const displayName = firstName || email.split('@')[0];

      const templateParams = {
        to_email: email,
        first_name: displayName,
        otp_code: otpCode,
        user_type: userType,
        app_name: 'Chifere Cebu',
        expiry_minutes: 10
      };

      const response = await emailjs.send(
        this.serviceId,
        this.templateIds.otpVerification,
        templateParams
      );

      console.log('OTP email sent successfully:', response);
      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email
   * @param {string} resetLink - Password reset link
   * @returns {Promise<Object>} - Result
   */
  async sendPasswordReset(email, resetLink) {
    try {
      if (!this.publicKey || this.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
        console.warn('EmailJS not configured. Mock password reset link:', resetLink);
        return { success: true, message: 'Password reset email sent (mock mode)', resetLink };
      }

      const templateParams = {
        to_email: email,
        reset_link: resetLink,
        app_name: 'Chifere Cebu',
        expiry_hours: 24
      };

      const response = await emailjs.send(
        this.serviceId,
        this.templateIds.passwordReset,
        templateParams
      );

      console.log('Password reset email sent successfully:', response);
      return { success: true, message: 'Password reset email sent successfully' };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order confirmation email
   * @param {string} email - Recipient email
   * @param {Object} orderData - Order information
   * @returns {Promise<Object>} - Result
   */
  async sendOrderConfirmation(email, orderData) {
    try {
      if (!this.publicKey || this.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
        console.warn('EmailJS not configured. Mock order confirmation for:', orderData.orderNumber);
        return { success: true, message: 'Order confirmation sent (mock mode)' };
      }

      const templateParams = {
        to_email: email,
        order_number: orderData.orderNumber,
        order_date: new Date(orderData.createdAt).toLocaleDateString(),
        total_amount: orderData.totalAmount,
        items_count: orderData.items?.length || 0,
        delivery_address: orderData.deliveryAddress?.address || 'N/A',
        app_name: 'Chifere Cebu'
      };

      const response = await emailjs.send(
        this.serviceId,
        this.templateIds.orderConfirmation,
        templateParams
      );

      console.log('Order confirmation email sent successfully:', response);
      return { success: true, message: 'Order confirmation sent successfully' };
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email
   * @param {string} email - Recipient email
   * @param {string} name - User name
   * @param {string} userType - User type (buyer/seller)
   * @returns {Promise<Object>} - Result
   */
  async sendWelcomeEmail(email, name, userType = 'buyer') {
    try {
      if (!this.publicKey || this.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
        console.warn('EmailJS not configured. Mock welcome email for:', name);
        return { success: true, message: 'Welcome email sent (mock mode)' };
      }

      const templateParams = {
        to_email: email,
        user_name: name,
        user_type: userType,
        app_name: 'Chifere Cebu',
        dashboard_url: userType === 'seller' ? '/seller/dashboard' : '/buyer/dashboard'
      };

      const response = await emailjs.send(
        this.serviceId,
        this.templateIds.welcomeEmail,
        templateParams
      );

      console.log('Welcome email sent successfully:', response);
      return { success: true, message: 'Welcome email sent successfully' };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification email
   * @param {string} email - Recipient email
   * @param {string} subject - Email subject
   * @param {string} message - Email message
   * @param {string} type - Notification type
   * @returns {Promise<Object>} - Result
   */
  async sendNotification(email, subject, message, type = 'general') {
    try {
      if (!this.publicKey || this.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
        console.warn('EmailJS not configured. Mock notification:', subject);
        return { success: true, message: 'Notification sent (mock mode)' };
      }

      const templateParams = {
        to_email: email,
        subject: subject,
        message: message,
        notification_type: type,
        app_name: 'Chifere Cebu',
        timestamp: new Date().toLocaleString()
      };

      const response = await emailjs.send(
        this.serviceId,
        this.templateIds.notification,
        templateParams
      );

      console.log('Notification email sent successfully:', response);
      return { success: true, message: 'Notification sent successfully' };
    } catch (error) {
      console.error('Error sending notification email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate and send OTP
   * @param {string} email - Recipient email
   * @param {string} userType - User type
   * @returns {Promise<Object>} - Result with OTP code
   */
  async generateAndSendOTP(email, userType = 'buyer') {
    try {
      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in localStorage for verification (in production, use database)
      const otpData = {
        email,
        code: otpCode,
        userType,
        expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
        attempts: 0
      };
      
      localStorage.setItem(`otp_${email}`, JSON.stringify(otpData));
      
      // Send OTP via email
      const result = await this.sendOTPVerification(email, otpCode, userType);
      
      if (result.success) {
        return { success: true, otpCode, message: 'OTP generated and sent successfully' };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error generating OTP:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify OTP code
   * @param {string} email - Email address
   * @param {string} code - OTP code to verify
   * @returns {Promise<Object>} - Result
   */
  async verifyOTP(email, code) {
    try {
      const otpData = localStorage.getItem(`otp_${email}`);
      
      if (!otpData) {
        return { success: false, error: 'No OTP found for this email' };
      }
      
      const parsedData = JSON.parse(otpData);
      
      // Check if OTP has expired
      if (Date.now() > parsedData.expiresAt) {
        localStorage.removeItem(`otp_${email}`);
        return { success: false, error: 'OTP has expired' };
      }
      
      // Check attempt limit
      if (parsedData.attempts >= 3) {
        localStorage.removeItem(`otp_${email}`);
        return { success: false, error: 'Too many failed attempts. Please request a new OTP.' };
      }
      
      // Verify code
      if (parsedData.code === code) {
        localStorage.removeItem(`otp_${email}`);
        return { success: true, message: 'OTP verified successfully' };
      } else {
        // Increment attempts
        parsedData.attempts += 1;
        localStorage.setItem(`otp_${email}`, JSON.stringify(parsedData));
        return { success: false, error: 'Invalid OTP code' };
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if EmailJS is properly configured
   * @returns {boolean} - Configuration status
   */
  isConfigured() {
    return !!(this.publicKey && this.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY');
  }
}

export default new EmailService();
