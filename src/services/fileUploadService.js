/**
 * File Upload Service
 * 
 * Handles file uploads for ID documents and other user files.
 * Provides file upload functionality with validation and Supabase storage.
 * 
 * Features:
 * - Upload ID documents (front/back)
 * - File validation (type, size)
 * - Generate unique file names
 * - Store in Supabase storage
 * 
 * @version 1.0.0
 */

import { supabase } from '../config/supabase';

class FileUploadService {
  /**
   * Upload product image
   * @param {File} file - Image file to upload
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} - Upload result
   */
  async uploadProductImage(file, userId, productId) {
    try {
      // Validate file
      const validation = this.validateImageFile(file);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${productId}/${Date.now()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      // Upload to Supabase storage
      console.log('📤 Uploading to bucket: product-images');
      console.log('📤 File path:', filePath);
      console.log('📤 File size:', file.size);
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Upload error:', error);
        console.error('❌ Error details:', error.message, error.statusCode);
        return { success: false, error: `Failed to upload image: ${error.message}` };
      }

      console.log('✅ Upload successful:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return {
        success: true,
        data: {
          path: filePath,
          url: urlData.publicUrl,
          fileName: fileName
        }
      };
    } catch (error) {
      console.error('Upload product image error:', error);
      return { success: false, error: 'Failed to upload image' };
    }
  }

  /**
   * Upload ID document file
   * @param {File} file - File to upload
   * @param {string} userId - User ID
   * @param {string} type - File type (front/back)
   * @returns {Promise<Object>} - Upload result
   */
  async uploadIDDocument(file, userId, type) {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_id_${type}_${Date.now()}.${fileExt}`;
      const filePath = `seller-ids/${fileName}`;

      // Upload to Supabase storage using seller-ids bucket
      console.log('📤 Uploading ID document to bucket: seller-ids');
      console.log('📤 File path:', filePath);
      
      // Ensure we have a valid session for uploads
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('⚠️ No active session, attempting upload anyway...');
      }
      
      const { data, error } = await supabase.storage
        .from('seller-ids')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('File upload error:', error);
        return { success: false, error: 'Failed to upload file' };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('seller-ids')
        .getPublicUrl(filePath);

      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath,
        fileName: fileName
      };
    } catch (error) {
      console.error('Upload ID document error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload multiple ID documents
   * @param {Object} files - Object with front and back files
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Upload results
   */
  async uploadIDDocuments(files, userId) {
    try {
      const results = {};

      // Upload front ID
      if (files.front) {
        const frontResult = await this.uploadIDDocument(files.front, userId, 'front');
        results.front = frontResult;
      }

      // Upload back ID
      if (files.back) {
        const backResult = await this.uploadIDDocument(files.back, userId, 'back');
        results.back = backResult;
      }

      // Check if all uploads were successful
      const allSuccessful = Object.values(results).every(result => result.success);
      
      if (allSuccessful) {
        return {
          success: true,
          data: {
            idFrontUrl: results.front?.url,
            idBackUrl: results.back?.url
          }
        };
      } else {
        return {
          success: false,
          error: 'Some files failed to upload',
          details: results
        };
      }
    } catch (error) {
      console.error('Upload ID documents error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @returns {Object} - Validation result
   */
  validateFile(file) {
    // Check if file exists
    if (!file) {
      return { isValid: false, error: 'No file selected' };
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 10MB' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File must be JPG, PNG, or PDF' };
    }

    return { isValid: true };
  }

  /**
   * Validate image file for product uploads
   * @param {File} file - File to validate
   * @returns {Object} - Validation result
   */
  validateImageFile(file) {
    // Check if file exists
    if (!file) {
      return { isValid: false, error: 'No file selected' };
    }

    // Check file size (5MB limit for images)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'Image size must be less than 5MB' };
    }

    // Check file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Image must be JPG, PNG, or WebP' };
    }

    return { isValid: true };
  }

  /**
   * Delete uploaded file
   * @param {string} filePath - Path to file in storage
   * @returns {Promise<Object>} - Delete result
   */
  async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from('user-documents')
        .remove([filePath]);

      if (error) {
        console.error('File deletion error:', error);
        return { success: false, error: 'Failed to delete file' };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete file error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get file URL from path
   * @param {string} filePath - Path to file in storage
   * @returns {string} - Public URL
   */
  getFileUrl(filePath) {
    const { data } = supabase.storage
      .from('user-documents')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  /**
   * Upload profile picture
   * @param {File} file - Image file to upload
   * @param {string} userId - User ID
   * @param {string} userType - User type (buyer/seller)
   * @returns {Promise<Object>} - Upload result
   */
  async uploadProfilePicture(file, userId, userType = 'user') {
    try {
      // Validate file
      const validation = this.validateImageFile(file);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_profile_${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload to Supabase storage
      console.log('📤 Uploading profile picture to bucket: profile-pictures');
      console.log('📤 File path:', filePath);
      console.log('📤 File size:', file.size);
      
      // Try profile-pictures bucket first, fallback to product-images if it doesn't exist
      let bucketName = 'profile-pictures';
      let { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting existing profile pictures
        });

      // If profile-pictures bucket doesn't exist, try product-images bucket
      if (error && error.message.includes('not found')) {
        console.log('📤 Profile-pictures bucket not found, trying product-images bucket');
        bucketName = 'product-images';
        filePath = `profile-pictures/${fileName}`; // Keep the same path structure
        ({ data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          }));
      }

      if (error) {
        console.error('❌ Profile picture upload error:', error);
        return { success: false, error: `Failed to upload profile picture: ${error.message}` };
      }

      console.log('✅ Profile picture upload successful:', data);

      // Get public URL using the bucket that was actually used
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return {
        success: true,
        data: {
          path: filePath,
          url: urlData.publicUrl,
          fileName: fileName
        }
      };
    } catch (error) {
      console.error('Upload profile picture error:', error);
      return { success: false, error: 'Failed to upload profile picture' };
    }
  }

  /**
   * Create storage bucket if it doesn't exist
   * @returns {Promise<Object>} - Result
   */
  async ensureStorageBucket() {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return { success: false, error: listError.message };
      }

      const bucketExists = buckets.some(bucket => bucket.name === 'user-documents');
      
      if (!bucketExists) {
        // Create bucket
        const { error: createError } = await supabase.storage.createBucket('user-documents', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
          fileSizeLimit: 10485760 // 10MB
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
          return { success: false, error: createError.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Ensure storage bucket error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new FileUploadService();

