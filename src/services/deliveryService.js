/**
 * Delivery Service
 *
 * Handles delivery operations with mock implementation.
 * Provides delivery tracking and management.
 *
 * Features:
 * - Create delivery requests
 * - Track deliveries
 * - Update delivery status
 * - Get delivery history
 *
 * @version 2.0.0 - Mock implementation (Supabase removed)
 */

class DeliveryService {
  /**
   * Create a new delivery request
   * @param {Object} deliveryData - Delivery data
   * @returns {Promise<Object>} - Result
   */
  async createDeliveryRequest(deliveryData) {
    try {
      const delivery = {
        id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderId: deliveryData.orderId || null,
        barterId: deliveryData.barterId || null,
        trackingNumber: deliveryData.trackingNumber || null,
        courier: deliveryData.courier || 'lalamove',
        courierTrackingId: deliveryData.courierTrackingId || null,
        status: 'pending',
        pickup: deliveryData.pickup || {},
        dropoff: deliveryData.dropoff || {},
        estimatedDelivery: deliveryData.estimatedDelivery || null,
        statusHistory: [
          {
            status: 'pending',
            timestamp: new Date().toISOString(),
            description: 'Delivery request created'
          }
        ],
        notes: deliveryData.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deliveredAt: null
      };

      // Store in localStorage
      const deliveries = JSON.parse(localStorage.getItem('chifere_deliveries') || '[]');
      deliveries.push(delivery);
      localStorage.setItem('chifere_deliveries', JSON.stringify(deliveries));

      return { success: true, deliveryId: delivery.id, delivery };
    } catch (error) {
      console.error('Create delivery request error:', error);
      return { success: false, error: 'Failed to create delivery request' };
    }
  }

  /**
   * Get delivery by ID
   * @param {string} deliveryId - Delivery ID
   * @returns {Promise<Object>} - Delivery details
   */
  async getDeliveryById(deliveryId) {
    try {
      const deliveries = JSON.parse(localStorage.getItem('chifere_deliveries') || '[]');
      const delivery = deliveries.find(d => d.id === deliveryId);

      if (!delivery) {
        return { success: false, error: 'Delivery not found' };
      }

      return { success: true, delivery };
    } catch (error) {
      console.error('Get delivery by ID error:', error);
      return { success: false, error: 'Failed to get delivery' };
    }
  }

  /**
   * Get deliveries for order
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} - Deliveries
   */
  async getDeliveriesForOrder(orderId) {
    try {
      const deliveries = JSON.parse(localStorage.getItem('chifere_deliveries') || '[]');
      const orderDeliveries = deliveries.filter(d => d.orderId === orderId);

      return { success: true, deliveries: orderDeliveries };
    } catch (error) {
      console.error('Get deliveries for order error:', error);
      return { success: false, error: 'Failed to get deliveries' };
    }
  }

  /**
   * Update delivery status
   * @param {string} deliveryId - Delivery ID
   * @param {string} status - New status
   * @param {string} description - Status description
   * @param {Object} additionalData - Additional data
   * @returns {Promise<Object>} - Result
   */
  async updateDeliveryStatus(deliveryId, status, description = '', additionalData = {}) {
    try {
      const deliveries = JSON.parse(localStorage.getItem('chifere_deliveries') || '[]');
      const deliveryIndex = deliveries.findIndex(d => d.id === deliveryId);

      if (deliveryIndex === -1) {
        return { success: false, error: 'Delivery not found' };
      }

      const delivery = deliveries[deliveryIndex];
      
      // Add status to history
      delivery.statusHistory.push({
        status,
        timestamp: new Date().toISOString(),
        description: description || `Status updated to ${status}`
      });

      // Update delivery
      delivery.status = status;
      delivery.updatedAt = new Date().toISOString();

      // Set deliveredAt if status is delivered
      if (status === 'delivered') {
        delivery.deliveredAt = new Date().toISOString();
      }

      // Update additional data
      Object.assign(delivery, additionalData);

      deliveries[deliveryIndex] = delivery;
      localStorage.setItem('chifere_deliveries', JSON.stringify(deliveries));

      return { success: true, delivery };
    } catch (error) {
      console.error('Update delivery status error:', error);
      return { success: false, error: 'Failed to update delivery status' };
    }
  }

  /**
   * Track delivery
   * @param {string} trackingNumber - Tracking number
   * @returns {Promise<Object>} - Tracking information
   */
  async trackDelivery(trackingNumber) {
    try {
      const deliveries = JSON.parse(localStorage.getItem('chifere_deliveries') || '[]');
      const delivery = deliveries.find(d => d.trackingNumber === trackingNumber);

      if (!delivery) {
        return { success: false, error: 'Delivery not found' };
      }

      // Mock tracking information
      const trackingInfo = {
        trackingNumber: delivery.trackingNumber,
        status: delivery.status,
        courier: delivery.courier,
        courierTrackingId: delivery.courierTrackingId,
        statusHistory: delivery.statusHistory,
        estimatedDelivery: delivery.estimatedDelivery,
        pickup: delivery.pickup,
        dropoff: delivery.dropoff
      };

      return { success: true, tracking: trackingInfo };
    } catch (error) {
      console.error('Track delivery error:', error);
      return { success: false, error: 'Failed to track delivery' };
    }
  }

  /**
   * Get delivery statistics
   * @param {string} userId - User ID (optional)
   * @returns {Promise<Object>} - Statistics
   */
  async getDeliveryStatistics(userId = null) {
    try {
      const deliveries = JSON.parse(localStorage.getItem('chifere_deliveries') || '[]');
      let filteredDeliveries = deliveries;

      // Filter by user if provided
      if (userId) {
        // This would require additional logic to filter by user's orders
        // For now, return all deliveries
      }

      const stats = {
        total: filteredDeliveries.length,
        pending: filteredDeliveries.filter(d => d.status === 'pending').length,
        pickedUp: filteredDeliveries.filter(d => d.status === 'picked_up').length,
        inTransit: filteredDeliveries.filter(d => d.status === 'in_transit').length,
        outForDelivery: filteredDeliveries.filter(d => d.status === 'out_for_delivery').length,
        delivered: filteredDeliveries.filter(d => d.status === 'delivered').length,
        failed: filteredDeliveries.filter(d => d.status === 'failed').length
      };

      return { success: true, statistics: stats };
    } catch (error) {
      console.error('Get delivery statistics error:', error);
      return { success: false, error: 'Failed to get delivery statistics' };
    }
  }

  /**
   * Get available couriers
   * @returns {Promise<Object>} - Available couriers
   */
  async getAvailableCouriers() {
    try {
      const couriers = [
        { id: 'lalamove', name: 'Lalamove', description: 'Fast and reliable delivery' },
        { id: 'jnt', name: 'J&T Express', description: 'Nationwide delivery' },
        { id: 'grab', name: 'Grab Express', description: 'On-demand delivery' },
        { id: 'ninjavan', name: 'Ninja Van', description: 'E-commerce delivery specialist' }
      ];

      return { success: true, couriers };
    } catch (error) {
      console.error('Get available couriers error:', error);
      return { success: false, error: 'Failed to get available couriers' };
    }
  }
}

export default new DeliveryService();