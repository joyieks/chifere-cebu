/**
 * KYC Service
 *
 * Handles KYC (Know Your Customer) verification with mock implementation.
 * Provides document upload and verification status management.
 *
 * Features:
 * - Upload KYC documents
 * - Get KYC status
 * - Update verification status
 * - Document management
 *
 * @version 2.0.0 - Mock implementation (Supabase removed)
 */

class KYCService {
  /**
   * Upload KYC documents
   * @param {string} userId - User ID
   * @param {Object} documents - Document data
   * @returns {Promise<Object>} - Result
   */
  async uploadKYCDocuments(userId, documents) {
    try {
      const kycData = {
        id: `kyc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        documents: {
          idFront: documents.idFront || null,
          idBack: documents.idBack || null,
          selfie: documents.selfie || null,
          businessPermit: documents.businessPermit || null,
          taxId: documents.taxId || null,
          bankStatement: documents.bankStatement || null
        },
        status: 'pending',
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
        notes: documents.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store in localStorage
      const kycRecords = JSON.parse(localStorage.getItem('chifere_kyc') || '[]');
      
      // Remove existing record for this user
      const filteredRecords = kycRecords.filter(record => record.userId !== userId);
      filteredRecords.push(kycData);
      
      localStorage.setItem('chifere_kyc', JSON.stringify(filteredRecords));

      return { success: true, kycId: kycData.id, kycData };
    } catch (error) {
      console.error('Upload KYC documents error:', error);
      return { success: false, error: 'Failed to upload KYC documents' };
    }
  }

  /**
   * Get KYC status for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - KYC status
   */
  async getKYCStatus(userId) {
    try {
      const kycRecords = JSON.parse(localStorage.getItem('chifere_kyc') || '[]');
      const kycRecord = kycRecords.find(record => record.userId === userId);

      if (!kycRecord) {
        return { success: true, status: 'none', kycData: null };
      }

      return { success: true, status: kycRecord.status, kycData: kycRecord };
    } catch (error) {
      console.error('Get KYC status error:', error);
      return { success: false, error: 'Failed to get KYC status' };
    }
  }

  /**
   * Update KYC status (admin function)
   * @param {string} kycId - KYC ID
   * @param {string} status - New status
   * @param {string} reviewedBy - Reviewer ID
   * @param {string} rejectionReason - Rejection reason (if rejected)
   * @returns {Promise<Object>} - Result
   */
  async updateKYCStatus(kycId, status, reviewedBy, rejectionReason = null) {
    try {
      const kycRecords = JSON.parse(localStorage.getItem('chifere_kyc') || '[]');
      const kycIndex = kycRecords.findIndex(record => record.id === kycId);

      if (kycIndex === -1) {
        return { success: false, error: 'KYC record not found' };
      }

      const kycRecord = kycRecords[kycIndex];
      kycRecord.status = status;
      kycRecord.reviewedAt = new Date().toISOString();
      kycRecord.reviewedBy = reviewedBy;
      kycRecord.rejectionReason = rejectionReason;
      kycRecord.updatedAt = new Date().toISOString();

      kycRecords[kycIndex] = kycRecord;
      localStorage.setItem('chifere_kyc', JSON.stringify(kycRecords));

      return { success: true, kycData: kycRecord };
    } catch (error) {
      console.error('Update KYC status error:', error);
      return { success: false, error: 'Failed to update KYC status' };
    }
  }

  /**
   * Get all KYC records (admin function)
   * @param {string} status - Filter by status
   * @returns {Promise<Object>} - KYC records
   */
  async getAllKYCRecords(status = null) {
    try {
      const kycRecords = JSON.parse(localStorage.getItem('chifere_kyc') || '[]');
      
      let filteredRecords = kycRecords;
      if (status) {
        filteredRecords = kycRecords.filter(record => record.status === status);
      }

      // Sort by submission date (newest first)
      filteredRecords.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      return { success: true, records: filteredRecords };
    } catch (error) {
      console.error('Get all KYC records error:', error);
      return { success: false, error: 'Failed to get KYC records' };
    }
  }

  /**
   * Delete KYC record
   * @param {string} kycId - KYC ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Result
   */
  async deleteKYCRecord(kycId, userId) {
    try {
      const kycRecords = JSON.parse(localStorage.getItem('chifere_kyc') || '[]');
      const kycRecord = kycRecords.find(record => record.id === kycId);

      if (!kycRecord) {
        return { success: false, error: 'KYC record not found' };
      }

      if (kycRecord.userId !== userId) {
        return { success: false, error: 'Unauthorized to delete this KYC record' };
      }

      const filteredRecords = kycRecords.filter(record => record.id !== kycId);
      localStorage.setItem('chifere_kyc', JSON.stringify(filteredRecords));

      return { success: true };
    } catch (error) {
      console.error('Delete KYC record error:', error);
      return { success: false, error: 'Failed to delete KYC record' };
    }
  }

  /**
   * Get KYC statistics
   * @returns {Promise<Object>} - KYC statistics
   */
  async getKYCStatistics() {
    try {
      const kycRecords = JSON.parse(localStorage.getItem('chifere_kyc') || '[]');
      
      const stats = {
        total: kycRecords.length,
        pending: kycRecords.filter(record => record.status === 'pending').length,
        approved: kycRecords.filter(record => record.status === 'approved').length,
        rejected: kycRecords.filter(record => record.status === 'rejected').length,
        none: 0 // This would need to be calculated based on total users
      };

      return { success: true, statistics: stats };
    } catch (error) {
      console.error('Get KYC statistics error:', error);
      return { success: false, error: 'Failed to get KYC statistics' };
    }
  }
}

export default new KYCService();