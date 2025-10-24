/**
 * Simplified Cart Service
 * This version handles missing tables gracefully and prevents 406 errors
 */

import { supabase } from '../config/supabase';

class CartServiceSimple {
  /**
   * Get cart for a user from Supabase (with error handling)
   */
  async getUserCart(userId) {
    try {
      console.log('🛒 [CartService] Getting cart for user:', userId);

      const { data, error } = await supabase
        .from('buyer_add_to_cart')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Handle any database errors gracefully
      if (error) {
        // Cart doesn't exist - return empty cart
        if (error.code === 'PGRST116') {
          console.log('🛒 [CartService] Cart not found, returning empty cart');
          return { success: true, data: { items: [], updatedAt: new Date() } };
        }
        
        // Table doesn't exist or permission error - return empty cart
        if (error.code === '42P01' || error.code === 'PGRST204' || error.message?.includes('relation') || error.message?.includes('table')) {
          console.warn('🛒 [CartService] Cart table issue, returning empty cart:', error.message);
          return { success: true, data: { items: [], updatedAt: new Date() } };
        }
        
        // Any other error - log and return empty cart
        console.warn('🛒 [CartService] Cart error, returning empty cart:', error);
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
      console.error('🛒 [CartService] Get user cart error:', error);
      // Always return success with empty cart to prevent app crashes
      return { success: true, data: { items: [], updatedAt: new Date() } };
    }
  }

  /**
   * Create a new empty cart for user
   */
  async createUserCart(userId) {
    try {
      console.log('🛒 [CartService] Creating cart for user:', userId);

      const { data, error } = await supabase
        .from('buyer_add_to_cart')
        .insert({
          user_id: userId,
          items: [],
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('🛒 [CartService] Create cart error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('🛒 [CartService] Create cart error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add item to cart (simplified version)
   */
  async addToCart(userId, item, quantity = 1) {
    try {
      console.log('🛒 [CartService] Adding to cart:', { userId, item, quantity });

      // Get current cart
      const cartResult = await this.getUserCart(userId);
      if (!cartResult.success) {
        return cartResult;
      }

      let items = cartResult.data.items || [];

      // Check if item already exists
      const existingItemIndex = items.findIndex(cartItem => cartItem.id === item.id);
      
      if (existingItemIndex >= 0) {
        // Update quantity
        items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        items.push({
          ...item,
          quantity,
          addedAt: new Date().toISOString()
        });
      }

      // Update cart in database
      const { data, error } = await supabase
        .from('buyer_add_to_cart')
        .upsert({
          user_id: userId,
          items,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('🛒 [CartService] Update cart error:', error);
        return { success: false, error: error.message };
      }

      console.log('🛒 [CartService] Cart updated successfully');
      return { success: true, data: { items } };
    } catch (error) {
      console.error('🛒 [CartService] Add to cart error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(userId, itemId) {
    try {
      console.log('🛒 [CartService] Removing from cart:', { userId, itemId });

      // Get current cart
      const cartResult = await this.getUserCart(userId);
      if (!cartResult.success) {
        return cartResult;
      }

      let items = cartResult.data.items || [];
      items = items.filter(item => item.id !== itemId);

      // Update cart in database
      const { data, error } = await supabase
        .from('buyer_add_to_cart')
        .upsert({
          user_id: userId,
          items,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('🛒 [CartService] Update cart error:', error);
        return { success: false, error: error.message };
      }

      console.log('🛒 [CartService] Item removed successfully');
      return { success: true, data: { items } };
    } catch (error) {
      console.error('🛒 [CartService] Remove from cart error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update item quantity in cart
   */
  async updateCartItemQuantity(userId, itemId, quantity) {
    try {
      console.log('🛒 [CartService] Updating quantity:', { userId, itemId, quantity });

      if (quantity <= 0) {
        return await this.removeFromCart(userId, itemId);
      }

      // Get current cart
      const cartResult = await this.getUserCart(userId);
      if (!cartResult.success) {
        return cartResult;
      }

      let items = cartResult.data.items || [];
      const itemIndex = items.findIndex(item => item.id === itemId);
      
      if (itemIndex >= 0) {
        items[itemIndex].quantity = quantity;
      } else {
        return { success: false, error: 'Item not found in cart' };
      }

      // Update cart in database
      const { data, error } = await supabase
        .from('buyer_add_to_cart')
        .upsert({
          user_id: userId,
          items,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('🛒 [CartService] Update cart error:', error);
        return { success: false, error: error.message };
      }

      console.log('🛒 [CartService] Quantity updated successfully');
      return { success: true, data: { items } };
    } catch (error) {
      console.error('🛒 [CartService] Update quantity error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId) {
    try {
      console.log('🛒 [CartService] Clearing cart for user:', userId);

      const { data, error } = await supabase
        .from('buyer_add_to_cart')
        .upsert({
          user_id: userId,
          items: [],
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('🛒 [CartService] Clear cart error:', error);
        return { success: false, error: error.message };
      }

      console.log('🛒 [CartService] Cart cleared successfully');
      return { success: true, data: { items: [] } };
    } catch (error) {
      console.error('🛒 [CartService] Clear cart error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get cart item count
   */
  async getCartItemCount(userId) {
    try {
      const cartResult = await this.getUserCart(userId);
      if (!cartResult.success) {
        return 0;
      }

      const items = cartResult.data.items || [];
      return items.reduce((total, item) => total + (item.quantity || 0), 0);
    } catch (error) {
      console.error('🛒 [CartService] Get cart count error:', error);
      return 0;
    }
  }

  /**
   * Check if item is in cart
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
      console.error('🛒 [CartService] Is item in cart error:', error);
      return false;
    }
  }

  /**
   * Get cart total
   */
  async getCartTotal(userId) {
    try {
      const cartResult = await this.getUserCart(userId);
      if (!cartResult.success) {
        return 0;
      }

      const items = cartResult.data.items || [];
      return items.reduce((total, item) => {
        const price = parseFloat(item.price || 0);
        const quantity = parseInt(item.quantity || 0);
        return total + (price * quantity);
      }, 0);
    } catch (error) {
      console.error('🛒 [CartService] Get cart total error:', error);
      return 0;
    }
  }
}

const cartServiceSimple = new CartServiceSimple();
export default cartServiceSimple;
