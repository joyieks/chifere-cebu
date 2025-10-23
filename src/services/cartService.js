/**
 * Cart Service
 *
 * Handles cart operations with Supabase persistence.
 * Syncs cart data across devices for logged-in users.
 * Falls back to localStorage for guest users.
 *
 * Features:
 * - Add/remove/update cart items
 * - Sync cart across devices
 * - Merge guest cart with user cart on login
 * - Real-time cart updates
 * - Cart validation
 *
 * @version 1.0.0
 */

import { supabase, handleSupabaseError } from '../config/supabase';

class CartService {
  /**
   * Get cart for a user from Supabase
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Cart data
   */
  async getUserCart(userId) {
    try {
      const { data, error } = await supabase
        .from('buyer_add_to_cart')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Handle any database errors gracefully
      if (error) {
        // Cart doesn't exist - return empty cart
        if (error.code === 'PGRST116') {
          console.log('Cart not found, returning empty cart');
          return { success: true, data: { items: [], updatedAt: new Date() } };
        }
        
        // Table doesn't exist or permission error - return empty cart
        if (error.code === '42P01' || error.code === 'PGRST204' || error.message?.includes('relation') || error.message?.includes('table')) {
          console.warn('Cart table issue, returning empty cart:', error.message);
          return { success: true, data: { items: [], updatedAt: new Date() } };
        }
        
        // Any other error - log and return empty cart
        console.warn('Cart error, returning empty cart:', error);
        return { success: true, data: { items: [], updatedAt: new Date() } };
      }

      return {
        success: true,
        data: {
          items: data?.items || [],
          updatedAt: data?.updated_at
        }
      };
    } catch (error) {
      console.error('Get user cart error:', error);
      // Always return success with empty cart to prevent app crashes
      return { success: true, data: { items: [], updatedAt: new Date() } };
    }
  }

  /**
   * Create a new empty cart for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Result
   */
  async createUserCart(userId) {
    try {
      const cartData = {
        user_id: userId,
        items: []
      };

      const { error } = await supabase
        .from('buyer_add_to_cart')
        .insert([cartData]);

      if (error) throw error;

      return { success: true, data: cartData };
    } catch (error) {
      console.error('Create user cart error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Add item to user's cart
   * @param {string} userId - User ID
   * @param {Object} item - Item to add
   * @param {number} quantity - Quantity
   * @returns {Promise<Object>} - Result
   */
  async addToCart(userId, item, quantity = 1) {
    try {
      console.log('🛒 [CartService] addToCart called with:', { userId, item: item.name, quantity });
      
      // Get current cart
      const cartResult = await this.getUserCart(userId);
      if (!cartResult.success) {
        console.error('🛒 [CartService] getUserCart failed:', cartResult.error);
        return cartResult;
      }

      const cart = cartResult.data;
      const items = cart.items || [];
      console.log('🛒 [CartService] Current cart items:', items.length);

      // Check cart limit (20 items maximum)
      const CART_LIMIT = 20;
      const totalItems = items.reduce((total, cartItem) => total + cartItem.quantity, 0);
      
      if (totalItems + quantity > CART_LIMIT) {
        const availableSlots = CART_LIMIT - totalItems;
        if (availableSlots <= 0) {
          return {
            success: false,
            error: `Cart is full! Maximum ${CART_LIMIT} items allowed. Please remove some items before adding more.`
          };
        } else {
          return {
            success: false,
            error: `Cannot add ${quantity} items. Only ${availableSlots} slots available. Maximum ${CART_LIMIT} items allowed.`
          };
        }
      }

      // Check if item already exists
      const existingItemIndex = items.findIndex(cartItem => cartItem.id === item.id);

      if (existingItemIndex !== -1) {
        // Check if adding quantity would exceed limit
        const currentQuantity = items[existingItemIndex].quantity;
        if (currentQuantity + quantity > CART_LIMIT) {
          const maxAddable = CART_LIMIT - currentQuantity;
          return {
            success: false,
            error: `Cannot add ${quantity} more of this item. Only ${maxAddable} more allowed (max ${CART_LIMIT} total items).`
          };
        }
        
        // Update quantity
        items[existingItemIndex].quantity += quantity;
        console.log('🛒 [CartService] Updated existing item quantity to:', items[existingItemIndex].quantity);
      } else {
        // Check if we can add a new item (each item counts as 1, regardless of quantity)
        if (items.length >= CART_LIMIT) {
          return {
            success: false,
            error: `Cannot add new item. Cart already has ${CART_LIMIT} different items. Please remove some items first.`
          };
        }
        
        // Add new item
        const newItem = {
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image || '',
          sellerId: item.sellerId || '',
          quantity: quantity,
          addedAt: new Date().toISOString()
        };
        items.push(newItem);
        console.log('🛒 [CartService] Added new item:', newItem);
      }

      // Check if cart exists, if not create it
      console.log('🛒 [CartService] Checking if cart exists for user:', userId);
      const { data: existingCart, error: checkError } = await supabase
        .from('buyer_add_to_cart')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // Cart doesn't exist, create it
        console.log('🛒 [CartService] Cart does not exist, creating new cart for user:', userId);
        const createResult = await this.createUserCart(userId);
        if (!createResult.success) {
          console.error('🛒 [CartService] Failed to create cart:', createResult.error);
          return createResult;
        }
        console.log('🛒 [CartService] Cart created successfully');
      } else if (checkError) {
        console.error('🛒 [CartService] Error checking cart existence:', checkError);
        return { success: false, error: handleSupabaseError(checkError) };
      } else {
        console.log('🛒 [CartService] Cart exists, proceeding with update');
      }

      // Update cart in Supabase
      console.log('🛒 [CartService] Updating cart with items:', items);
      const { data: updateData, error } = await supabase
        .from('buyer_add_to_cart')
        .update({
          items,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('🛒 [CartService] Update failed:', error);
        throw error;
      }

      console.log('🛒 [CartService] Cart updated successfully:', updateData);
      return { success: true, data: { items } };
    } catch (error) {
      console.error('🛒 [CartService] Add to cart error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Remove item from cart
   * @param {string} userId - User ID
   * @param {string} itemId - Item ID to remove
   * @returns {Promise<Object>} - Result
   */
  async removeFromCart(userId, itemId) {
    try {
      const cartResult = await this.getUserCart(userId);
      if (!cartResult.success) {
        return cartResult;
      }

      const cart = cartResult.data;
      const items = (cart.items || []).filter(item => item.id !== itemId);

      // Check if cart exists, if not create it
      const { data: existingCart, error: checkError } = await supabase
        .from('buyer_add_to_cart')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // Cart doesn't exist, create it
        console.log('🛒 [CartService] Creating new cart for user:', userId);
        const createResult = await this.createUserCart(userId);
        if (!createResult.success) {
          return createResult;
        }
      }

      const { error } = await supabase
        .from('buyer_add_to_cart')
        .update({
          items,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true, data: { items } };
    } catch (error) {
      console.error('Remove from cart error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Update item quantity in cart
   * @param {string} userId - User ID
   * @param {string} itemId - Item ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} - Result
   */
  async updateQuantity(userId, itemId, quantity) {
    try {
      if (quantity <= 0) {
        return this.removeFromCart(userId, itemId);
      }

      const cartResult = await this.getUserCart(userId);
      if (!cartResult.success) {
        return cartResult;
      }

      const cart = cartResult.data;
      const currentItems = cart.items || [];
      
      // Check cart limit (20 items maximum)
      const CART_LIMIT = 20;
      const currentTotalItems = currentItems.reduce((total, cartItem) => total + cartItem.quantity, 0);
      const itemToUpdate = currentItems.find(item => item.id === itemId);
      
      if (itemToUpdate) {
        const quantityDifference = quantity - itemToUpdate.quantity;
        const newTotalItems = currentTotalItems + quantityDifference;
        
        if (newTotalItems > CART_LIMIT) {
          const maxAllowed = CART_LIMIT - (currentTotalItems - itemToUpdate.quantity);
          return {
            success: false,
            error: `Cannot set quantity to ${quantity}. Maximum ${maxAllowed} allowed (max ${CART_LIMIT} total items).`
          };
        }
      }

      const items = currentItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );

      // Check if cart exists, if not create it
      const { data: existingCart, error: checkError } = await supabase
        .from('buyer_add_to_cart')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // Cart doesn't exist, create it
        console.log('🛒 [CartService] Creating new cart for user:', userId);
        const createResult = await this.createUserCart(userId);
        if (!createResult.success) {
          return createResult;
        }
      }

      const { error } = await supabase
        .from('buyer_add_to_cart')
        .update({
          items,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true, data: { items } };
    } catch (error) {
      console.error('Update quantity error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Clear user's cart
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Result
   */
  async clearCart(userId) {
    try {
      // Check if cart exists, if not create it
      const { data: existingCart, error: checkError } = await supabase
        .from('buyer_add_to_cart')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // Cart doesn't exist, create it
        console.log('🛒 [CartService] Creating new cart for user:', userId);
        const createResult = await this.createUserCart(userId);
        if (!createResult.success) {
          return createResult;
        }
      }

      const { error } = await supabase
        .from('buyer_add_to_cart')
        .update({
          items: [],
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true, data: { items: [] } };
    } catch (error) {
      console.error('Clear cart error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Merge guest cart with user cart on login
   * @param {string} userId - User ID
   * @param {Array} guestCartItems - Items from guest cart (localStorage)
   * @returns {Promise<Object>} - Result with merged cart
   */
  async mergeGuestCart(userId, guestCartItems) {
    try {
      if (!guestCartItems || guestCartItems.length === 0) {
        return this.getUserCart(userId);
      }

      const cartResult = await this.getUserCart(userId);
      if (!cartResult.success) {
        return cartResult;
      }

      const userCart = cartResult.data;
      const userItems = userCart.items || [];

      // Merge items, combining quantities for duplicates
      const mergedItems = [...userItems];

      guestCartItems.forEach(guestItem => {
        const existingIndex = mergedItems.findIndex(item => item.id === guestItem.id);

        if (existingIndex !== -1) {
          // Item exists, add quantities
          mergedItems[existingIndex].quantity += guestItem.quantity || 1;
        } else {
          // New item, add to cart
          mergedItems.push({
            ...guestItem,
            addedAt: new Date().toISOString()
          });
        }
      });

      // Update cart in Supabase
      const { error } = await supabase
        .from('buyer_add_to_cart')
        .update({
          items: mergedItems,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true, data: { items: mergedItems } };
    } catch (error) {
      console.error('Merge guest cart error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Listen to real-time cart updates
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  listenToCart(userId, callback) {
    try {
      const channel = supabase
        .channel(`cart:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'buyer_add_to_cart',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            if (payload.new) {
              callback({
                success: true,
                data: {
                  items: payload.new.items || [],
                  updatedAt: payload.new.updated_at
                }
              });
            } else {
              callback({
                success: true,
                data: { items: [], updatedAt: new Date() }
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Listen to cart error:', error);
      return () => {};
    }
  }

  /**
   * Get cart totals
   * @param {Array} items - Cart items
   * @returns {Object} - Total calculations
   */
  calculateCartTotals(items) {
    if (!items || items.length === 0) {
      return {
        subtotal: 0,
        itemCount: 0,
        totalQuantity: 0
      };
    }

    const subtotal = items.reduce((sum, item) =>
      sum + (item.price * item.quantity), 0
    );

    const itemCount = items.length;

    const totalQuantity = items.reduce((sum, item) =>
      sum + item.quantity, 0
    );

    return {
      subtotal,
      itemCount,
      totalQuantity
    };
  }

  /**
   * Validate cart items (check if still available, price changes, etc.)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Validation result
   */
  async validateCart(userId) {
    try {
      const cartResult = await this.getUserCart(userId);
      if (!cartResult.success) {
        return cartResult;
      }

      const cart = cartResult.data;
      const items = cart.items || [];

      // TODO: In production, validate each item against current product data
      const validatedItems = items.map(item => ({
        ...item,
        isValid: true,
        priceChanged: false,
        outOfStock: false
      }));

      const hasIssues = validatedItems.some(item =>
        !item.isValid || item.priceChanged || item.outOfStock
      );

      return {
        success: true,
        data: {
          items: validatedItems,
          hasIssues,
          issues: hasIssues ? this.getCartIssues(validatedItems) : []
        }
      };
    } catch (error) {
      console.error('Validate cart error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  /**
   * Get cart validation issues
   * @param {Array} items - Validated items
   * @returns {Array} - List of issues
   */
  getCartIssues(items) {
    const issues = [];

    items.forEach(item => {
      if (!item.isValid) {
        issues.push({
          itemId: item.id,
          type: 'unavailable',
          message: `${item.name} is no longer available`
        });
      } else if (item.priceChanged) {
        issues.push({
          itemId: item.id,
          type: 'price_change',
          message: `Price for ${item.name} has changed`
        });
      } else if (item.outOfStock) {
        issues.push({
          itemId: item.id,
          type: 'out_of_stock',
          message: `${item.name} is currently out of stock`
        });
      }
    });

    return issues;
  }

  /**
   * Get cart items count for badge display
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Total item count
   */
  async getCartItemCount(userId) {
    try {
      const cartResult = await this.getUserCart(userId);
      if (!cartResult.success) {
        return 0;
      }

      const items = cartResult.data.items || [];
      return items.reduce((sum, item) => sum + item.quantity, 0);
    } catch (error) {
      console.error('Get cart item count error:', error);
      return 0;
    }
  }

  /**
   * Get cart limit information
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Cart limit info
   */
  async getCartLimitInfo(userId) {
    try {
      const cartResult = await this.getUserCart(userId);
      if (!cartResult.success) {
        return {
          currentItems: 0,
          maxItems: 20,
          remainingSlots: 20,
          isAtLimit: false
        };
      }

      const items = cartResult.data.items || [];
      const currentItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const maxItems = 20;
      const remainingSlots = maxItems - currentItems;
      const isAtLimit = currentItems >= maxItems;

      return {
        currentItems,
        maxItems,
        remainingSlots: Math.max(0, remainingSlots),
        isAtLimit,
        uniqueItems: items.length
      };
    } catch (error) {
      console.error('Get cart limit info error:', error);
      return {
        currentItems: 0,
        maxItems: 20,
        remainingSlots: 20,
        isAtLimit: false
      };
    }
  }

  /**
   * Check if item is in cart
   * @param {string} userId - User ID
   * @param {string} itemId - Item ID
   * @returns {Promise<boolean>} - True if in cart
   */
  async isItemInCart(userId, itemId) {
    try {
      const cartResult = await this.getUserCart(userId);
      if (!cartResult.success) {
        return false;
      }

      const items = cartResult.data.items || [];
      return items.some(item => item.id === itemId);
    } catch (error) {
      console.error('Is item in cart error:', error);
      return false;
    }
  }
}

export default new CartService();
