/**
 * Unified Cart Service
 * Handles both possible database structures for buyer_add_to_cart table
 */

import { supabase } from '../config/supabase';
import productService from './productService';

class CartServiceUnified {
  /**
   * Detect the database structure and get cart for a user
   */
  async getUserCart(userId) {
    try {
      console.log('🛒 [CartServiceUnified] Getting cart for user:', userId);

      // First, probe legacy structure (single row with JSON items column)
      const { data: legacyData, error: legacyError } = await supabase
        .from('buyer_add_to_cart')
        .select('items, updated_at')
        .eq('user_id', userId)
        .limit(1);

      if (!legacyError) {
        console.log('🛒 [CartServiceUnified] Using legacy structure (JSON items)');
        const legacyItems = legacyData?.[0]?.items || [];
        return {
          success: true,
          data: {
            items: legacyItems,
            updatedAt: legacyData?.[0]?.updated_at ? new Date(legacyData[0].updated_at) : new Date(),
            structure: 'old',
            columns: { items: true }
          }
        };
      }

      // If legacy structure probe failed, fall back to new structure (individual rows)
      const { data: newStructureData, error: newStructureError } = await supabase
        .from('buyer_add_to_cart')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (!newStructureError && Array.isArray(newStructureData)) {
        console.log('🛒 [CartServiceUnified] Using new structure (individual rows)');
        const sampleRow = newStructureData[0] || null;
        const columnSupport = this.determineNewStructureColumnSupport(sampleRow);
        
        // Transform individual rows into cart items with metadata enrichment
        const items = await Promise.all(
          newStructureData.map(row => this.buildCartItemFromRow(row, columnSupport))
        );

        return {
          success: true,
          data: {
            items: items,
            updatedAt: new Date(),
            structure: 'new',
            columns: columnSupport
          }
        };
      }

      // If both probes fail, return empty cart but mark inferred structure
      console.log('🛒 [CartServiceUnified] No cart found, returning empty cart');
      return {
        success: true,
        data: {
          items: [],
          updatedAt: new Date(),
          structure: newStructureError ? 'unknown' : 'new',
          columns: newStructureError ? {} : this.determineNewStructureColumnSupport(null)
        }
      };

    } catch (error) {
      console.error('🛒 [CartServiceUnified] Get user cart error:', error);
      return { success: false, error: error.message };
    }
  }

  determineNewStructureColumnSupport(sampleRow) {
    const support = {
      order_type: false,
      is_barter: false,
      selling_mode: false,
      product_type: false,
      collection: false,
      seller_name: false,
      store_name: false
    };

    if (!sampleRow) {
      return support;
    }

    Object.keys(support).forEach(key => {
      support[key] = Object.prototype.hasOwnProperty.call(sampleRow, key);
    });

    return support;
  }

  async buildCartItemFromRow(row, columnSupport) {
    const context = await this.resolveCartRowContext(row, columnSupport);

    // Fetch current product to get available stock
    let availableQuantity = row.available_quantity || row.availableQuantity;
    if (!availableQuantity) {
      const productResult = await productService.getProductById(row.product_id);
      if (productResult.success && productResult.data) {
        availableQuantity = productResult.data.quantity || 0;
      }
    }

    return {
      id: row.product_id,
      itemId: row.product_id,
      name: row.product_name,
      price: parseFloat(row.product_price || row.price || 0),
      quantity: parseInt(row.quantity || 1),
      availableQuantity: availableQuantity || parseInt(row.quantity || 1),
      image: row.product_image || row.image || '',
      sellerId: row.seller_id,
      sellerName: context.sellerName,
      addedAt: row.added_at || row.created_at,
      orderType: context.orderType,
      isBarter: context.isBarter,
      sellingMode: context.sellingMode,
      productType: context.productType,
      collection: context.collection
    };
  }

  async resolveCartRowContext(row, columnSupport) {
    let orderType = columnSupport.order_type ? row.order_type : undefined;
    let isBarter = columnSupport.is_barter ? row.is_barter : undefined;
    let sellingMode = columnSupport.selling_mode ? row.selling_mode : undefined;
    let productType = columnSupport.product_type ? row.product_type : undefined;
    let collection = columnSupport.collection ? row.collection : undefined;
    let sellerName = columnSupport.seller_name
      ? row.seller_name || row.store_name || ''
      : row.store_name || '';

    if (!orderType && typeof isBarter === 'boolean') {
      orderType = isBarter ? 'barter' : 'purchase';
    }

    if (!orderType && (sellingMode === 'barter' || productType === 'barter' || collection === 'seller_addBarterItem')) {
      orderType = 'barter';
    }

    let productData = null;
    const ensureProductData = async () => {
      if (productData !== null) return;
      const productResult = await productService.getProductById(row.product_id);
      if (productResult.success) {
        productData = productResult.data;
      } else {
        productData = null;
      }
    };

    if (!orderType || !sellingMode || !productType || !sellerName || collection === undefined) {
      await ensureProductData();

      if (productData) {
        sellingMode = sellingMode || productData.selling_mode;
        productType = productType || productData.product_type;
        collection = collection !== undefined ? collection : productData.collection || productData.table_name || productData.source_table;

        if (!orderType) {
          if (
            productData.selling_mode === 'barter' ||
            productData.product_type === 'barter' ||
            productData.is_barter_only === true ||
            productData.orderType === 'barter'
          ) {
            orderType = 'barter';
          }
        }

        if (!sellerName && productData.user_profiles) {
          sellerName =
            productData.user_profiles.business_name ||
            productData.user_profiles.display_name ||
            '';
        }
      }
    }

    if (!orderType) {
      orderType = 'purchase';
    }

    if (typeof isBarter !== 'boolean') {
      isBarter = orderType === 'barter';
    }

    if (!sellingMode) {
      sellingMode = isBarter ? 'barter' : 'sell';
    }

    return {
      orderType,
      isBarter,
      sellingMode,
      productType,
      collection,
      sellerName: sellerName || ''
    };
  }

  async saveLegacyStructureItems(userId, items) {
    try {
      const payload = {
        user_id: userId,
        items,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('buyer_add_to_cart')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) {
        console.error('🛒 [CartServiceUnified] Legacy upsert failed:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: { items } };
    } catch (error) {
      console.error('🛒 [CartServiceUnified] Legacy save error:', error);
      return { success: false, error: error.message };
    }
  }

  async saveNewStructureItems(userId, items, columnSupport = {}) {
    try {
      await supabase
        .from('buyer_add_to_cart')
        .delete()
        .eq('user_id', userId);

      if (!items || items.length === 0) {
        return { success: true, data: { items: [] } };
      }

      const supports = (columnName) => Boolean(columnSupport && columnSupport[columnName]);

      const rows = items.map(cartItem => {
        const baseRow = {
          user_id: userId,
          product_id: cartItem.id,
          product_name: cartItem.name,
          product_price: cartItem.price,
          product_image: cartItem.image || '',
          seller_id: cartItem.sellerId || '',
          quantity: cartItem.quantity,
          added_at: cartItem.addedAt || new Date().toISOString()
        };

        const effectiveOrderType = cartItem.orderType || (cartItem.isBarter ? 'barter' : 'purchase');
        const effectiveIsBarter = cartItem.isBarter ?? (cartItem.orderType === 'barter');

        if (supports('order_type')) {
          baseRow.order_type = effectiveOrderType;
        }
        if (supports('is_barter')) {
          baseRow.is_barter = effectiveIsBarter;
        }
        if (supports('selling_mode')) {
          baseRow.selling_mode = cartItem.sellingMode || (effectiveIsBarter ? 'barter' : 'sell');
        }
        if (supports('product_type')) {
          baseRow.product_type = cartItem.productType || (effectiveIsBarter ? 'barter' : null);
        }
        if (supports('collection')) {
          baseRow.collection = cartItem.collection || null;
        }
        if (supports('seller_name')) {
          baseRow.seller_name = cartItem.sellerName || null;
        }
        if (supports('store_name')) {
          baseRow.store_name = cartItem.sellerName || null;
        }

        return baseRow;
      });

      const { error } = await supabase
        .from('buyer_add_to_cart')
        .insert(rows);

      if (error) {
        console.error('🛒 [CartServiceUnified] New structure insert failed:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: { items } };
    } catch (error) {
      console.error('🛒 [CartServiceUnified] New structure save error:', error);
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

      // Fetch current product to check available stock
      const productResult = await productService.getProductById(item.id);
      let availableStock = item.availableQuantity || item.quantity || 0;
      
      if (productResult.success && productResult.data) {
        availableStock = productResult.data.quantity || 0;
      }

      // Check if item already exists
      const existingItemIndex = currentItems.findIndex(cartItem => cartItem.id === item.id);
      
      if (existingItemIndex >= 0) {
        const existingItem = currentItems[existingItemIndex];
        const updatedQuantity = existingItem.quantity + quantity;
        
        // Validate against available stock
        if (updatedQuantity > availableStock) {
          return {
            success: false,
            error: `Only ${availableStock} item${availableStock !== 1 ? 's' : ''} available in stock. You already have ${existingItem.quantity} in your cart.`
          };
        }
        
        currentItems[existingItemIndex] = {
          ...existingItem,
          quantity: updatedQuantity,
          availableQuantity: availableStock,
          orderType: existingItem.orderType || item.orderType || (item.isBarter ? 'barter' : existingItem.orderType),
          isBarter: typeof existingItem.isBarter === 'boolean' ? existingItem.isBarter : item.isBarter,
          sellingMode: existingItem.sellingMode || item.sellingMode,
          productType: existingItem.productType || item.productType,
          collection: existingItem.collection || item.collection,
          sellerName: existingItem.sellerName || item.sellerName,
          addedAt: existingItem.addedAt || new Date().toISOString()
        };
      } else {
        // Validate against available stock for new item
        if (quantity > availableStock) {
          return {
            success: false,
            error: `Only ${availableStock} item${availableStock !== 1 ? 's' : ''} available in stock. Cannot add more than available quantity.`
          };
        }
        
        // Add new item
        currentItems.push({
          ...item,
          quantity,
          availableQuantity: availableStock,
          addedAt: new Date().toISOString()
        });
      }

      // Persist cart based on detected structure
      const structure = cartResult.data.structure || 'unknown';
      const columnSupport = cartResult.data.columns || {};

      let saveResult;

      if (structure === 'old') {
        saveResult = await this.saveLegacyStructureItems(userId, currentItems);
      } else {
        saveResult = await this.saveNewStructureItems(userId, currentItems, columnSupport);

        if (!saveResult.success && structure === 'unknown') {
          console.warn('🛒 [CartServiceUnified] New structure save failed, attempting legacy fallback');
          saveResult = await this.saveLegacyStructureItems(userId, currentItems);
        }
      }

      return saveResult;

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

      const structure = cartResult.data.structure || 'unknown';
      const columnSupport = cartResult.data.columns || {};

      let saveResult;

      if (structure === 'old') {
        saveResult = await this.saveLegacyStructureItems(userId, updatedItems);
      } else {
        saveResult = await this.saveNewStructureItems(userId, updatedItems, columnSupport);

        if (!saveResult.success && structure === 'unknown') {
          console.warn('🛒 [CartServiceUnified] New structure removal failed, attempting legacy fallback');
          saveResult = await this.saveLegacyStructureItems(userId, updatedItems);
        }
      }

      return saveResult;

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

      // Fetch current product to check available stock
      const productResult = await productService.getProductById(itemId);
      if (productResult.success && productResult.data) {
        const availableStock = productResult.data.quantity || 0;
        
        if (quantity > availableStock) {
          return {
            success: false,
            error: `Only ${availableStock} item${availableStock !== 1 ? 's' : ''} available in stock. Cannot add more than available quantity.`
          };
        }
        
        // Update availableQuantity in cart item
        currentItems[itemIndex].availableQuantity = availableStock;
      }

      // Update quantity
      currentItems[itemIndex].quantity = quantity;
      currentItems[itemIndex].addedAt = currentItems[itemIndex].addedAt || new Date().toISOString();

      const structure = cartResult.data.structure || 'unknown';
      const columnSupport = cartResult.data.columns || {};

      let saveResult;

      if (structure === 'old') {
        saveResult = await this.saveLegacyStructureItems(userId, currentItems);
      } else {
        saveResult = await this.saveNewStructureItems(userId, currentItems, columnSupport);

        if (!saveResult.success && structure === 'unknown') {
          console.warn('🛒 [CartServiceUnified] New structure quantity update failed, attempting legacy fallback');
          saveResult = await this.saveLegacyStructureItems(userId, currentItems);
        }
      }

      return saveResult;

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
