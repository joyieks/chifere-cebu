/**
 * Simplified Checkout Service
 * This version avoids complex foreign key relationships that might not exist
 */

import { supabase } from '../config/supabase';

class CheckoutServiceSimple {
  /**
   * Get user orders (simplified version)
   */
  async getUserOrders(userId, role = 'buyer', filters = {}) {
    try {
      console.log(`🔄 [CheckoutService] Getting user orders for ${role}:`, userId);

      // Simple query without complex relationships
      let query = supabase
        .from('orders')
        .select('*');

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

      // Get order items separately for each order
      const ordersWithItems = await Promise.all(
        (orders || []).map(async (order) => {
          try {
            const { data: items, error: itemsError } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', order.id);

            if (itemsError) {
              console.warn('⚠️ [CheckoutService] Could not fetch items for order:', order.id, itemsError);
              return { ...order, items: [] };
            }

            return { ...order, items: items || [] };
          } catch (error) {
            console.warn('⚠️ [CheckoutService] Error fetching items for order:', order.id, error);
            return { ...order, items: [] };
          }
        })
      );

      return {
        success: true,
        data: ordersWithItems
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
   * Get seller order statistics (simplified version)
   */
  async getSellerOrderStats(sellerId) {
    try {
      console.log('🔄 [CheckoutService] Getting seller stats for:', sellerId);

      // Get basic order counts
      const { data: orders, error } = await supabase
        .from('orders')
        .select('status, total_amount, payment_status')
        .eq('seller_id', sellerId);

      if (error) {
        console.error('❌ [CheckoutService] Get seller stats error:', error);
        throw new Error('Failed to fetch statistics');
      }

      // Calculate statistics
      const stats = {
        totalOrders: orders?.length || 0,
        totalRevenue: 0,
        pendingOrders: 0,
        processingOrders: 0,
        deliveredOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        paidOrders: 0,
        unpaidOrders: 0
      };

      // Process orders
      (orders || []).forEach(order => {
        // Count by status
        switch (order.status) {
          case 'review':
            stats.pendingOrders++;
            break;
          case 'processing':
            stats.processingOrders++;
            break;
          case 'deliver':
            stats.deliveredOrders++;
            break;
          case 'received':
            stats.completedOrders++;
            break;
          case 'cancelled':
            stats.cancelledOrders++;
            break;
        }

        // Count by payment status
        if (order.payment_status === 'paid') {
          stats.paidOrders++;
          stats.totalRevenue += parseFloat(order.total_amount || 0);
        } else {
          stats.unpaidOrders++;
        }
      });

      console.log('✅ [CheckoutService] Seller stats calculated:', stats);

      return {
        success: true,
        data: stats
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
   * Create a new order
   */
  async createOrder(orderData) {
    try {
      console.log('🔄 [CheckoutService] Creating order:', orderData);

      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Create order
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          buyer_id: orderData.buyerId,
          seller_id: orderData.sellerId,
          total_amount: orderData.totalAmount || 0,
          subtotal: orderData.subtotal || 0,
          shipping_fee: orderData.shippingFee || 0,
          tax_amount: orderData.taxAmount || 0,
          payment_method: orderData.paymentMethod || 'cash_on_delivery',
          payment_status: orderData.paymentStatus || 'pending',
          shipping_address: orderData.shippingAddress || {},
          shipping_contact: orderData.shippingContact || {},
          status: orderData.status || 'review',
          buyer_notes: orderData.buyerNotes,
          seller_notes: orderData.sellerNotes
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [CheckoutService] Create order error:', error);
        throw new Error('Failed to create order');
      }

      // Add order items if provided
      if (orderData.items && orderData.items.length > 0) {
        const items = orderData.items.map(item => ({
          order_id: order.id,
          product_id: item.productId,
          product_type: item.productType || 'product',
          product_name: item.productName || 'Unknown Product',
          product_image: item.productImage,
          product_price: item.productPrice || 0,
          quantity: item.quantity || 1,
          unit_price: item.unitPrice || item.productPrice || 0,
          total_price: (item.quantity || 1) * (item.unitPrice || item.productPrice || 0),
          product_specs: item.productSpecs || {}
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(items);

        if (itemsError) {
          console.error('❌ [CheckoutService] Create order items error:', itemsError);
          // Don't throw error here, order was created successfully
        }
      }

      console.log('✅ [CheckoutService] Order created successfully:', order.id);

      return {
        success: true,
        data: order
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
   */
  async updateOrderStatus(orderId, newStatus, changedBy, notes = null) {
    try {
      console.log('🔄 [CheckoutService] Updating order status:', { orderId, newStatus, changedBy });

      // Update order status
      const { data: order, error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          status_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('❌ [CheckoutService] Update order status error:', error);
        throw new Error('Failed to update order status');
      }

      // Add to status history
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: newStatus,
          changed_by: changedBy,
          notes: notes
        });

      if (historyError) {
        console.warn('⚠️ [CheckoutService] Could not add status history:', historyError);
      }

      console.log('✅ [CheckoutService] Order status updated successfully');

      return {
        success: true,
        data: order
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
   * Generate order number
   */
  async generateOrderNumber() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get count of orders for today
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString().slice(0, 10));

    const orderNumber = `${dateStr}-${String((count || 0) + 1).padStart(4, '0')}`;
    return orderNumber;
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId) {
    try {
      console.log('🔄 [CheckoutService] Getting order by ID:', orderId);

      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('❌ [CheckoutService] Get order by ID error:', error);
        throw new Error('Failed to fetch order');
      }

      // Get order items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) {
        console.warn('⚠️ [CheckoutService] Could not fetch order items:', itemsError);
      }

      return {
        success: true,
        data: { ...order, items: items || [] }
      };

    } catch (error) {
      console.error('❌ [CheckoutService] Get order by ID error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const checkoutServiceSimple = new CheckoutServiceSimple();
export default checkoutServiceSimple;
