/**
 * Checkout Service
 * 
 * Handles order creation, payment processing, and order management.
 * 
 * Features:
 * - Create orders with items
 * - Process payments
 * - Update order status
 * - Get order history
 * - Real-time order tracking
 * 
 * @version 1.0.0
 */

import { supabase } from '../config/supabase';

class CheckoutService {
  /**
   * Create a new order
   * @param {Object} orderData - Order information
   * @returns {Promise<Object>} - Order creation result
   */
  async createOrder(orderData) {
    try {
      console.log('🛒 [CheckoutService] Creating order:', orderData);
      
      const {
        buyerId,
        sellerId,
        items,
        shippingAddress,
        shippingContact,
        paymentMethod,
        shippingFee = 0,
        taxAmount = 0,
        buyerNotes = '',
        sellerNotes = ''
      } = orderData;

      // Validate required fields
      if (!buyerId || !sellerId || !items || !shippingAddress || !shippingContact || !paymentMethod) {
        throw new Error('Missing required order information');
      }

      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Order must contain at least one item');
      }

      // Calculate subtotal
      const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      const totalAmount = subtotal + shippingFee + taxAmount;

      // Generate order number
      const { data: orderNumberData, error: orderNumberError } = await supabase
        .rpc('generate_order_number');

      if (orderNumberError) {
        throw new Error('Failed to generate order number');
      }

      const orderNumber = orderNumberData;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          buyer_id: buyerId,
          seller_id: sellerId,
          total_amount: totalAmount,
          subtotal: subtotal,
          shipping_fee: shippingFee,
          tax_amount: taxAmount,
          payment_method: paymentMethod,
          payment_status: 'pending',
          shipping_address: shippingAddress,
          shipping_contact: shippingContact,
          status: 'review',
          buyer_notes: buyerNotes,
          seller_notes: sellerNotes
        })
        .select()
        .single();

      if (orderError) {
        console.error('❌ [CheckoutService] Order creation error:', orderError);
        throw new Error('Failed to create order');
      }

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_type: item.productType,
        product_name: item.productName,
        product_image: item.productImage,
        product_price: item.productPrice,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.unitPrice * item.quantity,
        product_specs: item.productSpecs || {}
      }));

      const { data: createdItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select();

      if (itemsError) {
        console.error('❌ [CheckoutService] Order items creation error:', itemsError);
        // Rollback order creation
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error('Failed to create order items');
      }

      // Create initial status history
      await supabase
        .from('order_status_history')
        .insert({
          order_id: order.id,
          status: 'review',
          changed_by: buyerId,
          notes: 'Order created'
        });

      // Create order confirmation notification
      await this.createOrderNotification(order.id, sellerId, 'order_confirmation', 
        'New Order Received', 
        `You have received a new order #${orderNumber} from ${shippingContact.name}`);

      console.log('✅ [CheckoutService] Order created successfully:', order.id);

      return {
        success: true,
        data: {
          ...order,
          items: createdItems
        }
      };

    } catch (error) {
      console.error('❌ [CheckoutService] Create order error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} newStatus - New status
   * @param {string} changedBy - User ID who changed the status
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} - Update result
   */
  async updateOrderStatus(orderId, newStatus, changedBy, notes = null) {
    try {
      console.log('🔄 [CheckoutService] Updating order status:', { orderId, newStatus, changedBy });

      // Use the database function to update status with validation
      const { data, error } = await supabase
        .rpc('update_order_status', {
          p_order_id: orderId,
          p_new_status: newStatus,
          p_changed_by: changedBy,
          p_notes: notes
        });

      if (error) {
        console.error('❌ [CheckoutService] Status update error:', error);
        throw new Error(error.message);
      }

      // Get updated order with details
      const { data: updatedOrder, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          order_status_history (*)
        `)
        .eq('id', orderId)
        .single();

      if (orderError) {
        console.error('❌ [CheckoutService] Failed to fetch updated order:', orderError);
      }

      // Create notification for status change
      await this.createStatusChangeNotification(orderId, newStatus, changedBy);

      console.log('✅ [CheckoutService] Order status updated successfully');

      return {
        success: true,
        data: updatedOrder
      };

    } catch (error) {
      console.error('❌ [CheckoutService] Update order status error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update payment status
   * @param {string} orderId - Order ID
   * @param {string} paymentStatus - Payment status
   * @param {string} paymentReference - Payment reference
   * @returns {Promise<Object>} - Update result
   */
  async updatePaymentStatus(orderId, paymentStatus, paymentReference = null) {
    try {
      console.log('💳 [CheckoutService] Updating payment status:', { orderId, paymentStatus });

      const { data, error } = await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          payment_reference: paymentReference,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('❌ [CheckoutService] Payment status update error:', error);
        throw new Error('Failed to update payment status');
      }

      // Create payment notification
      await this.createOrderNotification(orderId, data.buyer_id, 'payment_reminder',
        'Payment Status Updated',
        `Your payment for order #${data.order_number} has been marked as ${paymentStatus}`);

      console.log('✅ [CheckoutService] Payment status updated successfully');

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ [CheckoutService] Update payment status error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get orders for a user (buyer or seller)
   * @param {string} userId - User ID
   * @param {string} role - 'buyer' or 'seller'
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} - Orders result
   */
  async getUserOrders(userId, role = 'buyer', filters = {}) {
    try {
      console.log('📋 [CheckoutService] Getting user orders:', { userId, role, filters });

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          order_status_history (*),
          user_profiles!orders_buyer_id_fkey (id, display_name, business_name, profile_image),
          seller_profiles:user_profiles!orders_seller_id_fkey (id, display_name, business_name, profile_image)
        `);

      // Filter by role
      if (role === 'buyer') {
        query = query.eq('buyer_id', userId);
      } else if (role === 'seller') {
        query = query.eq('seller_id', userId);
      }

      // Apply additional filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.paymentStatus) {
        query = query.eq('payment_status', filters.paymentStatus);
      }
      if (filters.paymentMethod) {
        query = query.eq('payment_method', filters.paymentMethod);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Order by creation date (newest first)
      query = query.order('created_at', { ascending: false });

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      const { data: orders, error } = await query;

      if (error) {
        console.error('❌ [CheckoutService] Get user orders error:', error);
        throw new Error('Failed to fetch orders');
      }

      console.log(`✅ [CheckoutService] Found ${orders?.length || 0} orders`);

      return {
        success: true,
        data: orders || []
      };

    } catch (error) {
      console.error('❌ [CheckoutService] Get user orders error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} - Order result
   */
  async getOrderById(orderId, userId) {
    try {
      console.log('🔍 [CheckoutService] Getting order by ID:', orderId);

      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          order_status_history (*),
          user_profiles!orders_buyer_id_fkey (id, display_name, business_name, profile_image),
          seller_profiles:user_profiles!orders_seller_id_fkey (id, display_name, business_name, profile_image)
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('❌ [CheckoutService] Get order by ID error:', error);
        throw new Error('Order not found');
      }

      // Check if user has access to this order
      if (order.buyer_id !== userId && order.seller_id !== userId) {
        throw new Error('Access denied');
      }

      console.log('✅ [CheckoutService] Order found:', order.id);

      return {
        success: true,
        data: order
      };

    } catch (error) {
      console.error('❌ [CheckoutService] Get order by ID error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get order statistics for a seller
   * @param {string} sellerId - Seller ID
   * @returns {Promise<Object>} - Statistics result
   */
  async getSellerOrderStats(sellerId) {
    try {
      console.log('📊 [CheckoutService] Getting seller order stats:', sellerId);

      const { data: stats, error } = await supabase
        .from('orders')
        .select('status, payment_status, total_amount, created_at')
        .eq('seller_id', sellerId);

      if (error) {
        console.error('❌ [CheckoutService] Get seller stats error:', error);
        throw new Error('Failed to fetch statistics');
      }

      // Calculate statistics
      const totalOrders = stats.length;
      const totalRevenue = stats.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
      const pendingOrders = stats.filter(order => order.status === 'review').length;
      const processingOrders = stats.filter(order => order.status === 'processing').length;
      const deliveredOrders = stats.filter(order => order.status === 'deliver').length;
      const completedOrders = stats.filter(order => order.status === 'received').length;
      const paidOrders = stats.filter(order => order.payment_status === 'paid').length;

      // Calculate monthly revenue
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = stats
        .filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        })
        .reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

      const statistics = {
        totalOrders,
        totalRevenue,
        monthlyRevenue,
        pendingOrders,
        processingOrders,
        deliveredOrders,
        completedOrders,
        paidOrders,
        unpaidOrders: totalOrders - paidOrders
      };

      console.log('✅ [CheckoutService] Statistics calculated:', statistics);

      return {
        success: true,
        data: statistics
      };

    } catch (error) {
      console.error('❌ [CheckoutService] Get seller stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create order notification
   * @param {string} orderId - Order ID
   * @param {string} recipientId - Recipient user ID
   * @param {string} type - Notification type
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @returns {Promise<void>}
   */
  async createOrderNotification(orderId, recipientId, type, title, message) {
    try {
      await supabase
        .from('order_notifications')
        .insert({
          order_id: orderId,
          recipient_id: recipientId,
          notification_type: type,
          title,
          message
        });

      console.log('📧 [CheckoutService] Notification created:', { orderId, recipientId, type });
    } catch (error) {
      console.error('❌ [CheckoutService] Create notification error:', error);
    }
  }

  /**
   * Create status change notification
   * @param {string} orderId - Order ID
   * @param {string} newStatus - New status
   * @param {string} changedBy - User who changed the status
   * @returns {Promise<void>}
   */
  async createStatusChangeNotification(orderId, newStatus, changedBy) {
    try {
      // Get order details
      const { data: order, error } = await supabase
        .from('orders')
        .select('order_number, buyer_id, seller_id')
        .eq('id', orderId)
        .single();

      if (error) return;

      const statusMessages = {
        'review': 'Your order is under review',
        'processing': 'Your order is being processed',
        'deliver': 'Your order is out for delivery',
        'received': 'Your order has been delivered',
        'cancelled': 'Your order has been cancelled'
      };

      const title = 'Order Status Updated';
      const message = `Order #${order.order_number}: ${statusMessages[newStatus] || 'Status updated'}`;

      // Notify buyer
      if (order.buyer_id !== changedBy) {
        await this.createOrderNotification(orderId, order.buyer_id, 'status_update', title, message);
      }

      // Notify seller
      if (order.seller_id !== changedBy) {
        await this.createOrderNotification(orderId, order.seller_id, 'status_update', title, message);
      }

    } catch (error) {
      console.error('❌ [CheckoutService] Create status change notification error:', error);
    }
  }

  /**
   * Get order notifications for a user
   * @param {string} userId - User ID
   * @param {boolean} unreadOnly - Only get unread notifications
   * @returns {Promise<Object>} - Notifications result
   */
  async getUserNotifications(userId, unreadOnly = false) {
    try {
      let query = supabase
        .from('order_notifications')
        .select(`
          *,
          orders (order_number, status)
        `)
        .eq('recipient_id', userId)
        .order('sent_at', { ascending: false });

      if (unreadOnly) {
        query = query.is('read_at', null);
      }

      const { data: notifications, error } = await query;

      if (error) {
        console.error('❌ [CheckoutService] Get notifications error:', error);
        throw new Error('Failed to fetch notifications');
      }

      return {
        success: true,
        data: notifications || []
      };

    } catch (error) {
      console.error('❌ [CheckoutService] Get notifications error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} - Update result
   */
  async markNotificationAsRead(notificationId) {
    try {
      const { data, error } = await supabase
        .from('order_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) {
        console.error('❌ [CheckoutService] Mark notification as read error:', error);
        throw new Error('Failed to mark notification as read');
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ [CheckoutService] Mark notification as read error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new CheckoutService();
