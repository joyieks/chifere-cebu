/**
 * New Cart Service
 * This version works with individual cart item rows instead of a single cart with items array
 */

import { supabase } from '../config/supabase';

class CartServiceNew {
  /**
   * Get cart for a user from Supabase
   */
  async getUserCart(userId) {
    try {
      console.log('🛒 [CartService] Getting cart for user:', userId);

      const { data, error } = await supabase
        .from('buyer_add_to_cart')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('🛒 [CartService] Get cart error:', error);
        return { success: false, error: error.message };
      }

      // Transform individual rows into cart items
      const items = (data || []).map(row => ({
        id: row.product_id,
        itemId: row.product_id,
        name: row.product_name,
        price: parseFloat(row.product_price),
        quantity: parseInt(row.quantity),
        image: row.product_image || '',
        sellerId: row.seller_id,
        addedAt: row.added_at
      }));

      return {
        success: true,
        data: {
          items: items,
          updatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('🛒 [CartService] Get user cart error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add item to cart
   */
  async addToCart(userId, item, quantity = 1) {
    try {
      console.log('🛒 [CartService] Adding to cart:', { userId, item, quantity });

      // Check if item already exists in cart
      const { data: existingItem, error: checkError } = await supabase
        .from('buyer_add_to_cart')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', item.id || item.itemId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('🛒 [CartService] Check existing item error:', checkError);
        return { success: false, error: checkError.message };
      }

      if (existingItem) {
        // Update quantity of existing item
        const newQuantity = existingItem.quantity + quantity;
        
        const { data, error } = await supabase
          .from('buyer_add_to_cart')
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id)
          .select()
          .single();

        if (error) {
          console.error('🛒 [CartService] Update quantity error:', error);
          return { success: false, error: error.message };
        }

        console.log('🛒 [CartService] Quantity updated successfully');
        
        // Return updated cart
        const updatedCart = await this.getUserCart(userId);
        return { success: true, data: updatedCart.data };
      } else {
        // Add new item to cart
        const cartItem = {
          user_id: userId,
          product_id: item.id || item.itemId,
          product_type: 'product',
          product_name: item.name || 'Unknown Product',
          product_image: item.image || '',
          product_price: parseFloat(item.price) || 0,
          quantity: parseInt(quantity) || 1,
          seller_id: item.sellerId || null,
          added_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('buyer_add_to_cart')
          .insert([cartItem])
          .select()
          .single();

        if (error) {
          console.error('🛒 [CartService] Add to cart error:', error);
          return { success: false, error: error.message };
        }

        console.log('🛒 [CartService] Item added to cart successfully');
        
        // Return updated cart
        const updatedCart = await this.getUserCart(userId);
        return { success: true, data: updatedCart.data };
      }
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

      const { error } = await supabase
        .from('buyer_add_to_cart')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', itemId);

      if (error) {
        console.error('🛒 [CartService] Remove from cart error:', error);
        return { success: false, error: error.message };
      }

      console.log('🛒 [CartService] Item removed from cart successfully');
      
      // Return updated cart
      const updatedCart = await this.getUserCart(userId);
      return { success: true, data: updatedCart.data };
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

      const { data, error } = await supabase
        .from('buyer_add_to_cart')
        .update({
          quantity: parseInt(quantity),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('product_id', itemId)
        .select()
        .single();

      if (error) {
        console.error('🛒 [CartService] Update quantity error:', error);
        return { success: false, error: error.message };
      }

      console.log('🛒 [CartService] Quantity updated successfully');
      
      // Return updated cart
      const updatedCart = await this.getUserCart(userId);
      return { success: true, data: updatedCart.data };
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

      const { error } = await supabase
        .from('buyer_add_to_cart')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('🛒 [CartService] Clear cart error:', error);
        return { success: false, error: error.message };
      }

      console.log('🛒 [CartService] Cart cleared successfully');
      
      // Return empty cart
      return { success: true, data: { items: [], updatedAt: new Date() } };
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
      const { data, error } = await supabase
        .from('buyer_add_to_cart')
        .select('quantity')
        .eq('user_id', userId);

      if (error) {
        console.error('🛒 [CartService] Get cart count error:', error);
        return 0;
      }

      return (data || []).reduce((total, item) => total + (item.quantity || 0), 0);
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
      const { data, error } = await supabase
        .from('buyer_add_to_cart')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', itemId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('🛒 [CartService] Is item in cart error:', error);
        return false;
      }

      return !!data;
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
      const { data, error } = await supabase
        .from('buyer_add_to_cart')
        .select('product_price, quantity')
        .eq('user_id', userId);

      if (error) {
        console.error('🛒 [CartService] Get cart total error:', error);
        return 0;
      }

      return (data || []).reduce((total, item) => {
        const price = parseFloat(item.product_price || 0);
        const quantity = parseInt(item.quantity || 0);
        return total + (price * quantity);
      }, 0);
    } catch (error) {
      console.error('🛒 [CartService] Get cart total error:', error);
      return 0;
    }
  }
}

const cartServiceNew = new CartServiceNew();
export default cartServiceNew;
