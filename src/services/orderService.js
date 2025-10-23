/**
 * Order Service
 *
 * Handles order operations with Supabase integration.
 * Provides order creation, management, and tracking.
 *
 * Features:
 * - Create orders
 * - Get orders
 * - Update order status
 * - Track orders
 * - Order history
 *
 * @version 2.0.0 - Supabase integration
 */

import { supabase, handleSupabaseError } from '../config/supabase';

class OrderService {
  /**
   * Create a new order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} - Result
   */
  async createOrder(orderData) {
    try {
      const order = {
        order_number: this.generateOrderNumber(),
        buyer_id: orderData.buyerId,
        seller_id: orderData.sellerId,
        status: 'pending',
        payment_status: 'pending',
        delivery_status: 'pending',
        items: orderData.items || [],
        subtotal: orderData.subtotal || 0,
        delivery_fee: orderData.deliveryFee || 0,
        total_amount: orderData.totalAmount || 0,
        payment_method: orderData.paymentMethod || 'cod',
        delivery_address: orderData.deliveryAddress || {},
        notes: orderData.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('buyer_orders')
        .insert([order])
        .select()
        .single();

      if (error) throw error;

      return { success: true, orderId: data.id, order: data };
    } catch (error) {
      console.error('Create order error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Get orders for a user
   * @param {string} userId - User ID
   * @param {string} userType - User type (buyer/seller)
   * @returns {Promise<Object>} - Orders
   */
  async getOrders(userId, userType = 'buyer') {
    try {
      const column = userType === 'buyer' ? 'buyer_id' : 'seller_id';
      
      const { data, error } = await supabase
        .from('buyer_orders')
        .select('*')
        .eq(column, userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, orders: data || [] };
    } catch (error) {
      console.error('Get orders error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} - Order
   */
  async getOrderById(orderId) {
    try {
      const { data, error } = await supabase
        .from('buyer_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      return { success: true, order: data };
    } catch (error) {
      console.error('Get order by ID error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} newStatus - New status
   * @param {string} statusType - Type of status (status, payment_status, delivery_status)
   * @returns {Promise<Object>} - Result
   */
  async updateOrderStatus(orderId, newStatus, statusType = 'status') {
    try {
      const updateData = {
        [statusType]: newStatus,
        updated_at: new Date().toISOString()
      };

      // Set specific timestamps based on status
      if (newStatus === 'paid' && statusType === 'payment_status') {
        updateData.paid_at = new Date().toISOString();
      } else if (newStatus === 'delivered' && statusType === 'delivery_status') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('buyer_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      return { success: true, message: 'Order status updated successfully' };
    } catch (error) {
      console.error('Update order status error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Update order tracking information
   * @param {string} orderId - Order ID
   * @param {Object} trackingData - Tracking data
   * @returns {Promise<Object>} - Result
   */
  async updateOrderTracking(orderId, trackingData) {
    try {
      const updateData = {
        tracking_number: trackingData.trackingNumber,
        courier_service: trackingData.courierService,
        estimated_delivery: trackingData.estimatedDelivery,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('buyer_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      return { success: true, message: 'Tracking information updated successfully' };
    } catch (error) {
      console.error('Update order tracking error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Cancel an order
   * @param {string} orderId - Order ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} - Result
   */
  async cancelOrder(orderId, reason = '') {
    try {
      const updateData = {
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('buyer_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      return { success: true, message: 'Order cancelled successfully' };
    } catch (error) {
      console.error('Cancel order error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Get order statistics for a seller
   * @param {string} sellerId - Seller ID
   * @returns {Promise<Object>} - Statistics
   */
  async getOrderStatistics(sellerId) {
    try {
      const { data, error } = await supabase
        .from('buyer_orders')
        .select('status, payment_status, total_amount, created_at')
        .eq('seller_id', sellerId);

      if (error) throw error;

      const stats = {
        totalOrders: data.length,
        pendingOrders: data.filter(order => order.status === 'pending').length,
        processingOrders: data.filter(order => order.status === 'processing').length,
        completedOrders: data.filter(order => order.status === 'completed').length,
        cancelledOrders: data.filter(order => order.status === 'cancelled').length,
        totalRevenue: data
          .filter(order => order.payment_status === 'paid')
          .reduce((sum, order) => sum + (order.total_amount || 0), 0),
        thisMonthOrders: data.filter(order => {
          const orderDate = new Date(order.created_at);
          const now = new Date();
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        }).length
      };

      return { success: true, statistics: stats };
    } catch (error) {
      console.error('Get order statistics error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Generate order number
   * @returns {string} - Order number
   */
  generateOrderNumber() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CHF-${timestamp}-${random}`;
  }

  /**
   * Get orders by status
   * @param {string} userId - User ID
   * @param {string} status - Order status
   * @param {string} userType - User type (buyer/seller)
   * @returns {Promise<Object>} - Orders
   */
  async getOrdersByStatus(userId, status, userType = 'buyer') {
    try {
      const column = userType === 'buyer' ? 'buyer_id' : 'seller_id';
      
      const { data, error } = await supabase
        .from('buyer_orders')
        .select('*')
        .eq(column, userId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, orders: data || [] };
    } catch (error) {
      console.error('Get orders by status error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Search orders
   * @param {string} userId - User ID
   * @param {Object} filters - Search filters
   * @param {string} userType - User type (buyer/seller)
   * @returns {Promise<Object>} - Orders
   */
  async searchOrders(userId, filters = {}, userType = 'buyer') {
    try {
      const column = userType === 'buyer' ? 'buyer_id' : 'seller_id';
      
      let query = supabase
        .from('buyer_orders')
        .select('*')
        .eq(column, userId);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.paymentStatus) {
        query = query.eq('payment_status', filters.paymentStatus);
      }
      if (filters.deliveryStatus) {
        query = query.eq('delivery_status', filters.deliveryStatus);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.orderNumber) {
        query = query.ilike('order_number', `%${filters.orderNumber}%`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, orders: data || [] };
    } catch (error) {
      console.error('Search orders error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }
}

export default new OrderService();