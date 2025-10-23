# ID Verification Setup Guide

This guide explains how to set up the ID verification feature for seller registration in the Chifere application.

## Overview

The ID verification feature allows sellers to upload their valid government-issued IDs during registration. This helps verify seller identity and builds trust in the marketplace.

## Features Added

### 1. ID Type Selection
- Dropdown menu with common Philippine ID types
- Options include: Driver's License, Passport, National ID, Postal ID, Voter's ID, SSS ID, GSIS ID, PhilHealth ID, TIN ID, Senior Citizen ID, OFW ID, and Other Valid ID

### 2. ID Document Upload
- Front ID upload (required)
- Back ID upload (required)
- File validation (JPG, PNG, PDF up to 10MB)
- Visual feedback for file selection
- Drag-and-drop interface

### 3. Database Integration
- Stores ID type in `user_profiles.id_type`
- Stores front ID URL in `user_profiles.id_front_url`
- Stores back ID URL in `user_profiles.id_back_url`
- Links to Supabase storage for file management

## Setup Instructions

### 1. Database Setup

Run the SQL script to set up the storage bucket:

```sql
-- Run this in your Supabase SQL editor
\i SETUP_STORAGE_BUCKET.sql
```

This will:
- Create a `user-documents` storage bucket
- Set up RLS policies for secure file access
- Create helper functions for document management
- Set up automatic cleanup for temporary files

### 2. Environment Variables

Ensure your `.env` file has the correct Supabase configuration:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. File Upload Service

The `fileUploadService.js` provides:
- File validation (type, size)
- Secure upload to Supabase storage
- Unique filename generation
- Error handling and retry logic

### 4. Registration Flow

The updated registration flow for sellers:

1. **Basic Information**: Email, password, store details
2. **ID Verification**: Select ID type and upload documents
3. **File Upload**: Documents are uploaded to Supabase storage
4. **User Creation**: User profile is created with ID information
5. **Email Verification**: OTP is sent for email verification
6. **KYC Upload**: Additional business documents (optional)
7. **Completion**: Account is ready for use

## File Structure

```
src/
├── components/pages/Authentication/
│   └── signup.jsx (updated with ID fields)
├── contexts/
│   └── AuthContext.jsx (updated to handle ID data)
├── services/
│   └── fileUploadService.js (new file upload service)
└── config/
    └── supabase.js (existing Supabase config)
```

## Database Schema

The `user_profiles` table includes these new fields:

```sql
id_type TEXT,           -- Type of ID (drivers_license, passport, etc.)
id_front_url TEXT,      -- URL to front ID image/document
id_back_url TEXT,       -- URL to back ID image/document
seller_status TEXT,     -- pending, approved, rejected
verified_at TIMESTAMPTZ, -- When ID was verified
verified_by UUID,       -- Admin who verified the ID
rejection_reason TEXT   -- Reason for rejection if applicable
```

## Security Features

### 1. File Validation
- File type validation (JPG, PNG, PDF only)
- File size limit (10MB maximum)
- Malware scanning (handled by Supabase)

### 2. Access Control
- Users can only upload/view their own documents
- Admins can view all documents for verification
- RLS policies prevent unauthorized access

### 3. Data Protection
- Files are stored in secure Supabase storage
- URLs are generated with proper authentication
- Temporary files are automatically cleaned up

## Usage Examples

### Upload ID Documents

```javascript
import fileUploadService from '../services/fileUploadService';

// Upload ID documents
const result = await fileUploadService.uploadIDDocuments({
  front: frontFile,
  back: backFile
}, userId);

if (result.success) {
  console.log('Upload successful:', result.data);
} else {
  console.error('Upload failed:', result.error);
}
```

### Validate File

```javascript
const validation = fileUploadService.validateFile(file);
if (!validation.isValid) {
  console.error('Invalid file:', validation.error);
}
```

## Admin Verification

Admins can verify seller IDs through the admin dashboard:

1. View pending seller applications
2. Review uploaded ID documents
3. Approve or reject applications
4. Add rejection reasons if needed

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check file size (must be < 10MB)
   - Verify file type (JPG, PNG, PDF only)
   - Ensure Supabase storage bucket exists

2. **Permission Denied**
   - Verify RLS policies are set up correctly
   - Check user authentication status
   - Ensure storage bucket is public

3. **Database Errors**
   - Verify `user_profiles` table has ID fields
   - Check foreign key constraints
   - Ensure proper permissions

### Debug Steps

1. Check browser console for errors
2. Verify Supabase storage bucket exists
3. Test file upload with small test file
4. Check RLS policies in Supabase dashboard
5. Verify environment variables are correct

## Future Enhancements

1. **OCR Integration**: Extract text from ID images
2. **Face Matching**: Compare ID photo with user selfie
3. **Document Verification**: Verify ID authenticity
4. **Bulk Processing**: Process multiple verifications
5. **Notification System**: Notify users of verification status

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase documentation
3. Check browser console for errors
4. Verify database schema matches requirements

## Version History

- **v1.0.0**: Initial implementation with basic ID upload
- **v1.1.0**: Added file validation and error handling
- **v1.2.0**: Implemented secure storage with RLS policies
- **v1.3.0**: Added admin verification workflow


