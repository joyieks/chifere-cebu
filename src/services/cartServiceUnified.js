/**
 * Unified Cart Service
 * Handles both possible database structures for buyer_add_to_cart table
 */

import { supabase } from '../config/supabase';

class CartServiceUnified {
  /**
   * Detect the database structure and get cart for a user
   */
  async getUserCart(userId) {
    try {
      console.log('🛒 [CartServiceUnified] Getting cart for user:', userId);

      // First, try the new structure (individual rows)
      const { data: newStructureData, error: newStructureError } = await supabase
        .from('buyer_add_to_cart')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (!newStructureError && newStructureData) {
        console.log('🛒 [CartServiceUnified] Using new structure (individual rows)');
        
        // Transform individual rows into cart items
        const items = newStructureData.map(row => ({
          id: row.product_id,
          itemId: row.product_id,
          name: row.product_name,
          price: parseFloat(row.product_price || row.price || 0),
          quantity: parseInt(row.quantity || 1),
          image: row.product_image || row.image || '',
          sellerId: row.seller_id,
          addedAt: row.added_at || row.created_at
        }));

        return {
          success: true,
          data: {
            items: items,
            updatedAt: new Date()
          }
        };
      }

      // If new structure fails, try the old structure (JSON items)
      console.log('🛒 [CartServiceUnified] Trying old structure (JSON items)');
      const { data: oldStructureData, error: oldStructureError } = await supabase
        .from('buyer_add_to_cart')
        .select('items')
        .eq('user_id', userId)
        .single();

      if (!oldStructureError && oldStructureData && oldStructureData.items) {
        console.log('🛒 [CartServiceUnified] Using old structure (JSON items)');
        return {
          success: true,
          data: {
            items: oldStructureData.items,
            updatedAt: new Date()
          }
        };
      }

      // If both fail, return empty cart
      console.log('🛒 [CartServiceUnified] No cart found, returning empty cart');
      return {
        success: true,
        data: {
          items: [],
          updatedAt: new Date()
        }
      };

    } catch (error) {
      console.error('🛒 [CartServiceUnified] Get user cart error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add item to cart - tries both structures
   */
  async addToCart(userId, item, quantity = 1) {
    try {
      console.log('🛒 [CartServiceUnified] Adding to cart:', { userId, item: item.name, quantity });

      // Get current cart to check structure
      const cartResult = await this.getUserCart(userId);
      if (!cartResult.success) {
        return cartResult;
      }

      const currentItems = cartResult.data.items || [];

      // Check if item already exists
      const existingItemIndex = currentItems.findIndex(cartItem => cartItem.id === item.id);
      
      if (existingItemIndex >= 0) {
        // Update quantity
        currentItems[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        currentItems.push({
          ...item,
          quantity,
          addedAt: new Date().toISOString()
        });
      }

      // Try to save using new structure first (individual rows)
      try {
        // Clear existing items for this user
        await supabase
          .from('buyer_add_to_cart')
          .delete()
          .eq('user_id', userId);

        // Insert all items as individual rows
        const itemsToInsert = currentItems.map(cartItem => ({
          user_id: userId,
          product_id: cartItem.id,
          product_name: cartItem.name,
          product_price: cartItem.price,
          product_image: cartItem.image || '',
          seller_id: cartItem.sellerId || '',
          quantity: cartItem.quantity,
          added_at: cartItem.addedAt || new Date().toISOString()
        }));

        const { data, error } = await supabase
          .from('buyer_add_to_cart')
          .insert(itemsToInsert)
          .select();

        if (error) {
          console.log('🛒 [CartServiceUnified] New structure failed, trying old structure');
          throw error;
        }

        console.log('🛒 [CartServiceUnified] Successfully saved using new structure');
        return { success: true, data: { items: currentItems } };

      } catch (newStructureError) {
        console.log('🛒 [CartServiceUnified] New structure failed, trying old structure');
        
        // Try old structure (JSON items)
        const { data, error } = await supabase
          .from('buyer_add_to_cart')
          .upsert({
            user_id: userId,
            items: currentItems,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('🛒 [CartServiceUnified] Both structures failed:', error);
          return { success: false, error: error.message };
        }

        console.log('🛒 [CartServiceUnified] Successfully saved using old structure');
        return { success: true, data: { items: currentItems } };
      }

    } catch (error) {
      console.error('🛒 [CartServiceUnified] Add to cart error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(userId, itemId) {
    try {
      console.log('🛒 [CartServiceUnified] Removing from cart:', { userId, itemId });

      // Get current cart
      const cartResult = await this.getUserCart(userId);
      if (!cartResult.success) {
        return cartResult;
      }

      const currentItems = cartResult.data.items || [];
      const updatedItems = currentItems.filter(item => item.id !== itemId);

      // Try to save using new structure first
      try {
        // Clear existing items for this user
        await supabase
          .from('buyer_add_to_cart')
          .delete()
          .eq('user_id', userId);

        if (updatedItems.length > 0) {
          // Insert remaining items as individual rows
          const itemsToInsert = updatedItems.map(cartItem => ({
            user_id: userId,
            product_id: cartItem.id,
            product_name: cartItem.name,
            product_price: cartItem.price,
            product_image: cartItem.image || '',
            seller_id: cartItem.sellerId || '',
            quantity: cartItem.quantity,
            added_at: cartItem.addedAt || new Date().toISOString()
          }));

          await supabase
            .from('buyer_add_to_cart')
            .insert(itemsToInsert);
        }

        console.log('🛒 [CartServiceUnified] Successfully removed using new structure');
        return { success: true, data: { items: updatedItems } };

      } catch (newStructureError) {
        // Try old structure
        const { data, error } = await supabase
          .from('buyer_add_to_cart')
          .upsert({
            user_id: userId,
            items: updatedItems,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('🛒 [CartServiceUnified] Both structures failed:', error);
          return { success: false, error: error.message };
        }

        console.log('🛒 [CartServiceUnified] Successfully removed using old structure');
        return { success: true, data: { items: updatedItems } };
      }

    } catch (error) {
      console.error('🛒 [CartServiceUnified] Remove from cart error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update item quantity
   */
  async updateQuantity(userId, itemId, quantity) {
    try {
      console.log('🛒 [CartServiceUnified] Updating quantity:', { userId, itemId, quantity });

      // Get current cart
      const cartResult = await this.getUserCart(userId);
      if (!cartResult.success) {
        return cartResult;
      }

      const currentItems = cartResult.data.items || [];
      const itemIndex = currentItems.findIndex(item => item.id === itemId);

      if (itemIndex === -1) {
        return { success: false, error: 'Item not found in cart' };
      }

      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        return await this.removeFromCart(userId, itemId);
      }

      // Update quantity
      currentItems[itemIndex].quantity = quantity;

      // Save using the same logic as addToCart
      return await this.addToCart(userId, currentItems[itemIndex], 0); // 0 because we're replacing

    } catch (error) {
      console.error('🛒 [CartServiceUnified] Update quantity error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId) {
    try {
      console.log('🛒 [CartServiceUnified] Clearing cart for user:', userId);

      // Try new structure first
      const { error: newStructureError } = await supabase
        .from('buyer_add_to_cart')
        .delete()
        .eq('user_id', userId);

      if (newStructureError) {
        // Try old structure
        const { error: oldStructureError } = await supabase
          .from('buyer_add_to_cart')
          .upsert({
            user_id: userId,
            items: [],
            updated_at: new Date().toISOString()
          });

        if (oldStructureError) {
          console.error('🛒 [CartServiceUnified] Both structures failed:', oldStructureError);
          return { success: false, error: oldStructureError.message };
        }
      }

      console.log('🛒 [CartServiceUnified] Cart cleared successfully');
      return { success: true, data: { items: [] } };

    } catch (error) {
      console.error('🛒 [CartServiceUnified] Clear cart error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new CartServiceUnified();
