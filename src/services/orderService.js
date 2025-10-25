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
   * Generate a UUID v4
   * @returns {string} - UUID string
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Create a new order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} - Result
   */
  async createOrder(orderData) {
    try {
      console.log('📦 [OrderService] Creating order with data:', orderData);

      // Calculate totals
      const items = orderData.items || [];
      const subtotal = items.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity || item.qty) || 1;
        return sum + (price * quantity);
      }, 0);
      
      const deliveryFee = parseFloat(orderData.deliveryFee) || 0;
      const totalAmount = subtotal + deliveryFee;

      console.log('🔍 [OrderService] Creating order with buyerId:', {
        buyerId: orderData.buyerId,
        buyerIdType: typeof orderData.buyerId,
        buyerIdValue: orderData.buyerId,
        isNull: orderData.buyerId === null,
        isUndefined: orderData.buyerId === undefined
      });

      // Ensure we have a valid buyer_id
      const buyerId = orderData.buyerId || orderData.buyer_id;
      if (!buyerId) {
        console.error('❌ [OrderService] No buyer ID provided!', orderData);
        throw new Error('Buyer ID is required to create an order');
      }

      // Determine seller_id from the first item if not provided
      let sellerId = orderData.sellerId;
      if (!sellerId && items.length > 0) {
        sellerId = items[0].sellerId;
        console.log('🔍 [OrderService] Auto-detected seller_id from first item:', sellerId);
      }

      const order = {
        order_number: this.generateOrderNumber(),
        buyer_id: buyerId,
        seller_id: sellerId,
        status: 'pending',
        payment_status: orderData.paymentStatus || 'pending',
        delivery_status: 'pending',
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
        payment_method: orderData.paymentMethod || 'cod',
        payment_reference: orderData.paymentId || null,
        delivery_address: orderData.deliveryAddress || {},
        notes: orderData.buyerMessage || orderData.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📦 [OrderService] Order to insert:', order);

      // Create the order
      const { data: orderResult, error: orderError } = await supabase
        .from('buyer_orders')
        .insert([order])
        .select()
        .single();

      if (orderError) {
        console.error('❌ [OrderService] Order creation error:', orderError);
        throw orderError;
      }

      console.log('✅ [OrderService] Order created:', orderResult);

      // Create order items
      if (items.length > 0) {
        // Get seller_id for each item from all product tables
        const orderItems = await Promise.all(items.map(async (item) => {
          let itemSellerId = item.sellerId || item.seller_id;
          
          // If no seller_id, try to get it from product tables
          if (!itemSellerId) {
            const productId = item.product_id || item.id || item.itemId;
            if (productId) {
              try {
                // Try products table first
                let { data: product, error: productError } = await supabase
                  .from('products')
                  .select('seller_id')
                  .eq('id', productId)
                  .single();
                
                // If not found, try seller_add_item_preloved
                if (productError || !product?.seller_id) {
                  const { data: prelovedProduct, error: prelovedError } = await supabase
                    .from('seller_add_item_preloved')
                    .select('seller_id')
                    .eq('id', productId)
                    .single();
                  
                  if (!prelovedError && prelovedProduct?.seller_id) {
                    product = prelovedProduct;
                    productError = null;
                  }
                }
                
                // If still not found, try seller_add_barter_item
                if (productError || !product?.seller_id) {
                  const { data: barterProduct, error: barterError } = await supabase
                    .from('seller_add_barter_item')
                    .select('seller_id')
                    .eq('id', productId)
                    .single();
                  
                  if (!barterError && barterProduct?.seller_id) {
                    product = barterProduct;
                    productError = null;
                  }
                }
                
                if (!productError && product?.seller_id) {
                  itemSellerId = product.seller_id;
                  console.log('✅ [OrderService] Found seller_id for item:', item.name, itemSellerId);
                }
              } catch (error) {
                console.warn('⚠️ [OrderService] Could not fetch seller_id for item:', item.name, error);
              }
            }
          }
          
          return {
            order_id: orderResult.id,
            product_id: item.product_id || item.id || item.itemId || this.generateUUID(),
            product_type: 'product',
            product_name: item.name || 'Unknown Product',
            product_image: item.image || '',
            product_price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity || item.qty) || 1,
            unit_price: parseFloat(item.price) || 0,
            total_price: (parseFloat(item.price) || 0) * (parseInt(item.quantity || item.qty) || 1),
            product_specs: {},
            seller_id: itemSellerId,
            created_at: new Date().toISOString()
          };
        }));

        console.log('📦 [OrderService] Order items to insert:', orderItems);

        const { error: itemsError } = await supabase
          .from('buyer_order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('❌ [OrderService] Order items creation error:', itemsError);
          console.error('❌ [OrderService] Failed order items data:', orderItems);
          // Don't throw error here, order was created successfully
        } else {
          console.log('✅ [OrderService] Order items created successfully');
          console.log('✅ [OrderService] Created items:', orderItems.length);
        }

        // Update seller_id from first item if not provided
        let finalSellerId = null;
        
        if (!orderData.sellerId && items[0]?.sellerId) {
          console.log('🔍 [OrderService] Setting seller_id from first item:', items[0].sellerId);
          finalSellerId = items[0].sellerId;
        } else if (!orderData.sellerId && !items[0]?.sellerId) {
          // If no seller ID is provided, we need to get it from the product
          console.log('⚠️ [OrderService] No seller ID provided in order data or items');
          console.log('🔍 [OrderService] Items data:', items);
          
          // Try to get seller ID from the first product - check ALL product tables
          const productId = items[0]?.product_id || items[0]?.id || items[0]?.itemId;
          if (productId) {
            try {
              // Try products table first
              let { data: product, error: productError } = await supabase
                .from('products')
                .select('seller_id')
                .eq('id', productId)
                .single();
              
              // If not found in products, try seller_add_item_preloved
              if (productError || !product?.seller_id) {
                console.log('🔍 [OrderService] Product not found in products table, trying seller_add_item_preloved');
                const { data: prelovedProduct, error: prelovedError } = await supabase
                  .from('seller_add_item_preloved')
                  .select('seller_id')
                  .eq('id', productId)
                  .single();
                
                if (!prelovedError && prelovedProduct?.seller_id) {
                  product = prelovedProduct;
                  productError = null;
                }
              }
              
              // If still not found, try seller_add_barter_item
              if (productError || !product?.seller_id) {
                console.log('🔍 [OrderService] Product not found in preloved table, trying seller_add_barter_item');
                const { data: barterProduct, error: barterError } = await supabase
                  .from('seller_add_barter_item')
                  .select('seller_id')
                  .eq('id', productId)
                  .single();
                
                if (!barterError && barterProduct?.seller_id) {
                  product = barterProduct;
                  productError = null;
                }
              }
              
              if (!productError && product?.seller_id) {
                console.log('✅ [OrderService] Found seller_id from product:', product.seller_id);
                finalSellerId = product.seller_id;
              } else {
                console.error('❌ [OrderService] Could not find product or seller_id:', productError);
                // Use a fallback - you might want to set this to a default seller or handle differently
                finalSellerId = '00000000-0000-0000-0000-000000000001';
              }
            } catch (error) {
              console.error('❌ [OrderService] Error fetching product seller_id:', error);
              finalSellerId = '00000000-0000-0000-0000-000000000001';
            }
          } else {
            console.error('❌ [OrderService] No product_id/id/itemId in first item, cannot determine seller');
            console.error('❌ [OrderService] First item structure:', items[0]);
            finalSellerId = '00000000-0000-0000-0000-000000000001';
          }
        } else {
          finalSellerId = orderData.sellerId;
        }

        // Update the order with the final seller ID
        if (finalSellerId) {
          await supabase
            .from('buyer_orders')
            .update({ seller_id: finalSellerId })
            .eq('id', orderResult.id);
          
          // Also update all order items with the seller ID
          await supabase
            .from('buyer_order_items')
            .update({ seller_id: finalSellerId })
            .eq('order_id', orderResult.id);
        }
      }

      return { success: true, orderId: orderResult.id, order: orderResult };
    } catch (error) {
      console.error('❌ [OrderService] Create order error:', error);
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
      
      console.log('🔍 [OrderService] Getting orders for:', { userId, userType, column });
      console.log('🔍 [OrderService] User ID type:', typeof userId, 'Value:', userId);
      
      // First get the orders
      const { data: orders, error: ordersError } = await supabase
        .from('buyer_orders')
        .select('*')
        .eq(column, userId)
        .order('created_at', { ascending: false });

      console.log('🔍 [OrderService] Raw orders query result:', { 
        orders: orders?.length || 0, 
        ordersError,
        queryColumn: column,
        queryValue: userId
      });

      if (ordersError) {
        console.error('❌ [OrderService] Orders query error:', ordersError);
        throw ordersError;
      }

      // Then get order items for each order
      const ordersWithItems = await Promise.all(
        (orders || []).map(async (order) => {
          console.log('🔍 [OrderService] Getting items for order:', order.id, order.order_number);
          
          const { data: orderItems, error: itemsError } = await supabase
            .from('buyer_order_items')
            .select('*')
            .eq('order_id', order.id);

          console.log('🔍 [OrderService] Order items result:', {
            orderId: order.id,
            orderNumber: order.order_number,
            itemsCount: orderItems?.length || 0,
            items: orderItems,
            error: itemsError,
            itemsType: typeof orderItems,
            itemsIsArray: Array.isArray(orderItems)
          });

          if (itemsError) {
            console.warn('❌ [OrderService] Failed to load order items for order:', order.id, itemsError);
          }

          // For buyers, also fetch address information
          let shippingAddress = {};
          let shippingContact = {};

          if (userType === 'buyer' && order.buyer_id) {
            console.log('🔍 [OrderService] Fetching address for buyer:', order.buyer_id);
            
            try {
              // Fetch address information from buyer_addresses table
              const { data: addressData, error: addressError } = await supabase
                .from('buyer_addresses')
                .select('id, user_id, name, type, address_line_1, address_line_2, barangay, city, province, zip_code, country, is_default, is_active, created_at')
                .eq('user_id', order.buyer_id)
                .eq('is_active', true)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

              if (!addressError && addressData) {
                console.log('✅ [OrderService] Found address info for buyer:', addressData);
                shippingAddress = {
                  street: addressData.address_line_1 || '',
                  street2: addressData.address_line_2 || '',
                  barangay: addressData.barangay || '',
                  city: addressData.city || '',
                  province: addressData.province || '',
                  postal_code: addressData.zip_code || '',
                  country: addressData.country || 'Philippines',
                  type: addressData.type || 'home'
                };
                shippingContact = {
                  name: addressData.name || 'No name provided',
                  phone: 'N/A', // Address table doesn't have phone
                  email: 'N/A'
                };
              } else {
                console.log('⚠️ [OrderService] No address found in buyer_addresses table:', addressError);
                console.log('🔍 [OrderService] Checking order.delivery_address:', order.delivery_address);
                
                // Use delivery_address from order as fallback
                if (order.delivery_address && typeof order.delivery_address === 'object') {
                  console.log('✅ [OrderService] Using delivery_address from order:', order.delivery_address);
                  
                  // If delivery_address has a structured format, use it directly
                  if (order.delivery_address.street || order.delivery_address.city) {
                    shippingAddress = order.delivery_address;
                    shippingContact = {
                      name: order.delivery_address.name || 'No name provided',
                      phone: order.delivery_address.phone || 'N/A',
                      email: 'N/A'
                    };
                  } else if (order.delivery_address.address) {
                    // If delivery_address has a string format, parse it
                    const addressString = order.delivery_address.address;
                    console.log('🔍 [OrderService] Parsing address string:', addressString);
                    
                    // Clean up the address string (remove 'undefined' and 'null')
                    const cleanAddress = addressString
                      .replace(/undefined/g, '')
                      .replace(/null/g, '')
                      .replace(/,\s*,/g, ',') // Remove double commas
                      .replace(/^,\s*/, '') // Remove leading comma
                      .replace(/,\s*$/, '') // Remove trailing comma
                      .trim();
                    
                    // Split the address into parts and filter out empty parts
                    const addressParts = cleanAddress.split(',').map(part => part.trim()).filter(part => part.length > 0);
                    console.log('🔍 [OrderService] Address parts:', addressParts);
                    
                    // Use the first meaningful part as street, rest as additional info
                    const street = addressParts.length > 0 ? addressParts[0] : '';
                    const additionalInfo = addressParts.length > 1 ? addressParts.slice(1).join(', ') : '';
                    
                    shippingAddress = {
                      street: street,
                      street2: additionalInfo,
                      barangay: '',
                      city: '',
                      province: '',
                      postal_code: '',
                      country: 'Philippines',
                      type: 'home'
                    };
                    shippingContact = {
                      name: order.delivery_address.name || 'No name provided',
                      phone: order.delivery_address.phone || 'N/A',
                      email: 'N/A'
                    };
                  }
                } else {
                  console.log('⚠️ [OrderService] No delivery_address in order either');
                }
              }
            } catch (addressError) {
              console.warn('⚠️ [OrderService] Error fetching address info for buyer:', addressError);
            }
          }

          const result = {
            ...order,
            order_items: orderItems || [],
            shipping_address: shippingAddress,
            shipping_contact: shippingContact
          };

          console.log('🔍 [OrderService] Final order object:', {
            orderNumber: result.order_number,
            orderId: result.id,
            itemsCount: result.order_items?.length || 0,
            items: result.order_items
          });

          return result;
        })
      );

      console.log('🔍 [OrderService] Final result:', {
        ordersCount: ordersWithItems.length,
        ordersWithItems: ordersWithItems.map(order => ({
          orderNumber: order.order_number,
          orderId: order.id,
          itemsCount: order.order_items?.length || 0,
          items: order.order_items
        }))
      });

      return { success: true, orders: ordersWithItems };
    } catch (error) {
      console.error('Get orders error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Get seller orders with enhanced data
   * @param {string} sellerId - Seller ID
   * @returns {Promise<Object>} - Orders with customer and item details
   */
  async getSellerOrders(sellerId) {
    try {
      console.log('🔍 [OrderService] Getting seller orders for:', { 
        sellerId, 
        sellerIdType: typeof sellerId,
        sellerIdValue: sellerId 
      });
      
      // First, let's check what seller IDs exist in the database
      const { data: allSellerIds, error: sellerIdsError } = await supabase
        .from('buyer_orders')
        .select('seller_id')
        .not('seller_id', 'is', null);
      
      console.log('🔍 [OrderService] All seller IDs in database:', allSellerIds);
      
      // First get the orders
      const { data: orders, error: ordersError } = await supabase
        .from('buyer_orders')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      console.log('🔍 [OrderService] Raw seller orders query result:', { 
        orders, 
        ordersError, 
        ordersCount: orders?.length || 0,
        querySellerId: sellerId
      });

      if (ordersError) throw ordersError;

      // Then get order items and customer info for each order
      const ordersWithDetails = await Promise.all(
        (orders || []).map(async (order) => {
          // Get order items
          const { data: orderItems, error: itemsError } = await supabase
            .from('buyer_order_items')
            .select('*')
            .eq('order_id', order.id);

          if (itemsError) {
            console.warn('Failed to load order items for order:', order.id, itemsError);
          }

          // Get actual customer info from auth.users
          let user_profiles = {
            display_name: 'Customer', // Default fallback
            email: 'customer@example.com', // Default fallback
            phone: 'N/A' // Default fallback
          };

          if (order.buyer_id) {
            try {
              // First try to get from buyer_users table
              const { data: buyerData, error: buyerError } = await supabase
                .from('buyer_users')
                .select('id, email, display_name, first_name, last_name, phone, address')
                .eq('id', order.buyer_id)
                .single();

              if (!buyerError && buyerData) {
                user_profiles = {
                  display_name: buyerData.display_name || 
                               `${buyerData.first_name || ''} ${buyerData.last_name || ''}`.trim() ||
                               buyerData.email?.split('@')[0] || 
                               'Customer',
                  email: buyerData.email || 'customer@example.com',
                  phone: buyerData.phone || 'N/A',
                  address: buyerData.address || 'N/A'
                };
                console.log('✅ [OrderService] Found buyer info from buyer_users:', user_profiles);
              } else {
                // Fallback to auth.users if buyer_users doesn't exist
                console.log('⚠️ [OrderService] buyer_users not found, trying auth.users...');
                const { data: authData, error: authError } = await supabase
                  .from('auth.users')
                  .select('id, email, raw_user_meta_data')
                  .eq('id', order.buyer_id)
                  .single();

                if (!authError && authData) {
                  user_profiles = {
                    display_name: authData.raw_user_meta_data?.full_name || 
                                 authData.raw_user_meta_data?.name || 
                                 authData.email?.split('@')[0] || 
                                 'Customer',
                    email: authData.email || 'customer@example.com',
                    phone: authData.raw_user_meta_data?.phone || 'N/A',
                    address: 'N/A'
                  };
                  console.log('✅ [OrderService] Found buyer info from auth.users:', user_profiles);
                } else {
                  console.warn('⚠️ [OrderService] Could not find buyer info from either table:', { buyerError, authError });
                }
              }

              // Now fetch address information from buyer_addresses table
              // Note: We need to find the correct way to link addresses to buyers
              // Since there might not be a direct user_id column, we'll try different approaches
              try {
                // First, try to find if there's a user_id or buyer_id column
                let addressData = null;
                let addressError = null;

                // Try with user_id first
                const { data: addressData1, error: addressError1 } = await supabase
                  .from('buyer_addresses')
                  .select('id, user_id, name, type, address_line_1, address_line_2, barangay, city, province, zip_code, country, is_default, is_active, created_at')
                  .eq('user_id', order.buyer_id)
                  .eq('is_active', true)
                  .order('is_default', { ascending: false })
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single();

                if (!addressError1 && addressData1) {
                  addressData = addressData1;
                  console.log('✅ [OrderService] Found address info with user_id:', addressData);
                } else {
                  // Try with buyer_id
                  const { data: addressData2, error: addressError2 } = await supabase
                    .from('buyer_addresses')
                    .select('*')
                    .eq('buyer_id', order.buyer_id)
                    .order('is_default', { ascending: false })
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                  if (!addressError2 && addressData2) {
                    addressData = addressData2;
                    console.log('✅ [OrderService] Found address info with buyer_id:', addressData);
                  } else {
                    // If no direct link, get the first available address as fallback
                    const { data: addressData3, error: addressError3 } = await supabase
                      .from('buyer_addresses')
                      .select('*')
                      .eq('is_active', true)
                      .order('is_default', { ascending: false })
                      .order('created_at', { ascending: false })
                      .limit(1)
                      .single();

                    if (!addressError3 && addressData3) {
                      addressData = addressData3;
                      console.log('✅ [OrderService] Using fallback address info:', addressData);
                    } else {
                      console.log('⚠️ [OrderService] No address found for buyer:', { addressError1, addressError2, addressError3 });
                    }
                  }
                }

                if (addressData) {
                  // Update user_profiles with address information
                  user_profiles.address = addressData;
                }
              } catch (addressError) {
                console.warn('⚠️ [OrderService] Error fetching address info:', addressError);
              }

            } catch (error) {
              console.warn('⚠️ [OrderService] Error fetching buyer info:', error);
            }
          }

          // Structure the address information properly
          let shippingAddress = {};
          let shippingContact = {
            name: user_profiles.display_name,
            phone: user_profiles.phone,
            email: user_profiles.email
          };

          // If we have address data from buyer_addresses table
          if (user_profiles.address && typeof user_profiles.address === 'object') {
            shippingAddress = {
              street: user_profiles.address.address_line_1 || '',
              street2: user_profiles.address.address_line_2 || '',
              barangay: user_profiles.address.barangay || '',
              city: user_profiles.address.city || '',
              province: user_profiles.address.province || '',
              postal_code: user_profiles.address.zip_code || '',
              country: user_profiles.address.country || 'Philippines',
              type: user_profiles.address.type || 'home'
            };
            // Use the name from address if available, otherwise use user_profiles
            shippingContact.name = user_profiles.address.name || user_profiles.display_name;
            shippingContact.phone = user_profiles.phone;
          } else if (order.delivery_address && typeof order.delivery_address === 'object') {
            // Fallback to delivery_address from order
            shippingAddress = order.delivery_address;
          }

          return {
            ...order,
            order_items: orderItems || [],
            user_profiles: user_profiles,
            shipping_address: shippingAddress,
            shipping_contact: shippingContact
          };
        })
      );

      return { success: true, data: ordersWithDetails };
    } catch (error) {
      console.error('Get seller orders error:', error);
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
      // Get the order
      const { data: order, error: orderError } = await supabase
        .from('buyer_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Get order items
      const { data: orderItems, error: itemsError } = await supabase
        .from('buyer_order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) {
        console.warn('❌ [OrderService] Failed to load order items for order:', orderId, itemsError);
      }

      // Get shipping address if available
      let shippingAddress = {};
      let shippingContact = {};

      if (order.shipping_address_id) {
        const { data: address, error: addressError } = await supabase
          .from('shipping_addresses')
          .select('*')
          .eq('id', order.shipping_address_id)
          .single();

        if (!addressError && address) {
          shippingAddress = address;
        }
      }

      if (order.shipping_contact_id) {
        const { data: contact, error: contactError } = await supabase
          .from('shipping_contacts')
          .select('*')
          .eq('id', order.shipping_contact_id)
          .single();

        if (!contactError && contact) {
          shippingContact = contact;
        }
      }

      // Combine order with items and address info
      const orderWithItems = {
        ...order,
        order_items: orderItems || [],
        shipping_address: shippingAddress,
        shipping_contact: shippingContact
      };

      console.log('🔍 [OrderService] Order with items:', {
        orderId: order.id,
        orderNumber: order.order_number,
        itemsCount: orderItems?.length || 0,
        items: orderItems,
        hasShippingAddress: !!shippingAddress.id,
        hasShippingContact: !!shippingContact.id
      });

      return { success: true, order: orderWithItems };
    } catch (error) {
      console.error('Get order by ID error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} newStatus - New status
   * @param {string} changedBy - User ID who changed the status
   * @param {string} notes - Optional notes
   * @param {string} statusType - Type of status (status, payment_status, delivery_status)
   * @returns {Promise<Object>} - Result
   */
  async updateOrderStatus(orderId, newStatus, changedBy, notes = null, statusType = 'status') {
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

      // Add notes if provided
      if (notes) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('buyer_orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      // Create order status history entry
      await this.createOrderStatusHistory(orderId, newStatus, changedBy, notes, statusType);

      return { success: true, message: 'Order status updated successfully', data };
    } catch (error) {
      console.error('Update order status error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Create order status history entry
   * @param {string} orderId - Order ID
   * @param {string} status - Status
   * @param {string} changedBy - User ID who changed the status
   * @param {string} notes - Optional notes
   * @param {string} statusType - Type of status
   * @returns {Promise<Object>} - Result
   */
  async createOrderStatusHistory(orderId, status, changedBy, notes = null, statusType = 'status') {
    try {
      const historyEntry = {
        order_id: orderId,
        status: status,
        status_type: statusType,
        changed_by: changedBy,
        notes: notes,
        changed_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('order_status_history')
        .insert([historyEntry]);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Create order status history error:', error);
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
   * Mark order as received by buyer
   * @param {string} orderId - Order ID
   * @param {string} buyerId - Buyer ID
   * @returns {Promise<Object>} - Result
   */
  async markOrderAsReceived(orderId, buyerId) {
    try {
      console.log('🔍 [OrderService] Marking order as received:', { orderId, buyerId });

      const updateData = {
        status: 'completed',
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('buyer_orders')
        .update(updateData)
        .eq('id', orderId)
        .eq('buyer_id', buyerId) // Ensure buyer can only mark their own orders as received
        .select();

      if (error) {
        console.error('❌ [OrderService] Mark order as received error:', error);
        throw error;
      }

      console.log('✅ [OrderService] Order marked as received:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ [OrderService] Mark order as received error:', error);
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
        cancelled_by: 'buyer',
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
   * Get seller order statistics (enhanced version)
   * @param {string} sellerId - Seller ID
   * @returns {Promise<Object>} - Statistics
   */
  async getSellerOrderStats(sellerId) {
    try {
      const { data, error } = await supabase
        .from('buyer_orders')
        .select('status, payment_status, total_amount, created_at')
        .eq('seller_id', sellerId);

      if (error) throw error;

      const stats = {
        totalOrders: data.length,
        pendingOrders: data.filter(order => order.status === 'pending' || order.status === 'review').length,
        processingOrders: data.filter(order => order.status === 'processing').length,
        deliveredOrders: data.filter(order => order.status === 'deliver').length,
        receivedOrders: data.filter(order => order.status === 'received').length,
        cancelledOrders: data.filter(order => order.status === 'cancelled').length,
        totalRevenue: data
          .filter(order => order.payment_status === 'paid')
          .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0),
        thisMonthOrders: data.filter(order => {
          const orderDate = new Date(order.created_at);
          const now = new Date();
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        }).length,
        paidOrders: data.filter(order => order.payment_status === 'paid').length,
        pendingPayments: data.filter(order => order.payment_status === 'pending').length
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Get seller order stats error:', error);
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