import { supabase, handleSupabaseError } from '../config/supabase';

class ItemService {
  // Create preloved item
  async createPrelovedItem(itemData) {
    try {
      const { data, error } = await supabase
        .from('seller_add_item_preloved')
        .insert([itemData])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Create preloved item error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Create barter item
  async createBarterItem(itemData) {
    try {
      const { data, error } = await supabase
        .from('seller_add_barter_item')
        .insert([itemData])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Create barter item error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Create new item (legacy method)
  async createItem(itemData, sellerId) {
    try {
      // Determine collection based on item type
      const tableName = itemData.isBarterOnly
        ? 'seller_add_barter_item'
        : 'seller_add_item_preloved';

      const itemDoc = {
        ...itemData,
        seller_id: sellerId,
        status: 'active', // active, sold, bartered, inactive
        views: 0,
        likes: 0,
        is_barter_only: itemData.isBarterOnly || false,
        is_sell_only: itemData.isSellOnly || false,
        is_both: itemData.isBoth || false,
        barter_requests: [],
        barter_offers: [],
        // Default values
        rating: 0,
        total_ratings: 0,
        is_featured: false,
        is_verified: false
      };

      const { data, error } = await supabase
        .from(tableName)
        .insert([itemDoc])
        .select()
        .single();

      if (error) throw error;

      return { success: true, itemId: data.id, collection: tableName };
    } catch (error) {
      console.error('Create item error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Upload item images
  async uploadItemImages(itemId, images) {
    try {
      const imageUrls = [];

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const imagePath = `items/${itemId}/image_${i}_${Date.now()}`;

        const { error: uploadError } = await supabase.storage
          .from('items')
          .upload(imagePath, image);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('items')
          .getPublicUrl(imagePath);

        imageUrls.push(urlData.publicUrl);
      }

      return { success: true, imageUrls };
    } catch (error) {
      console.error('Upload images error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Get item by ID
  async getItem(itemId) {
    try {
      // Try preloved collection first
      let { data: itemData, error: prelovedError } = await supabase
        .from('seller_add_item_preloved')
        .select('*')
        .eq('id', itemId)
        .single();

      if (!prelovedError && itemData) {
        return { success: true, data: { ...itemData, collection: 'seller_add_item_preloved' } };
      }

      // Try barter collection
      ({ data: itemData, error: prelovedError } = await supabase
        .from('seller_add_barter_item')
        .select('*')
        .eq('id', itemId)
        .single());

      if (!prelovedError && itemData) {
        return { success: true, data: { ...itemData, collection: 'seller_add_barter_item' } };
      }

      // Fallback: try old items collection for migration compatibility
      ({ data: itemData, error: prelovedError } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single());

      if (!prelovedError && itemData) {
        return { success: true, data: { ...itemData, collection: 'items' } };
      }

      return { success: false, error: 'Item not found' };
    } catch (error) {
      console.error('Get item error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Get items by seller
  async getItemsBySeller(sellerId, status = 'active') {
    try {
      // Build queries for both collections
      let prelovedQuery = supabase
        .from('seller_add_item_preloved')
        .select('*')
        .eq('seller_id', sellerId);
      
      let barterQuery = supabase
        .from('seller_add_barter_item')
        .select('*')
        .eq('seller_id', sellerId);
      
      // Only filter by status if it's not 'all' or null
      if (status && status !== 'all') {
        prelovedQuery = prelovedQuery.eq('status', status);
        barterQuery = barterQuery.eq('status', status);
      }
      
      // Query both collections
      const [prelovedResult, barterResult] = await Promise.all([
        prelovedQuery.order('created_at', { ascending: false }),
        barterQuery.order('created_at', { ascending: false })
      ]);

      if (prelovedResult.error) throw prelovedResult.error;
      if (barterResult.error) throw barterResult.error;

      // Use Map to deduplicate by ID
      const itemsMap = new Map();
      
      // Add preloved items
      (prelovedResult.data || []).forEach(item => {
        itemsMap.set(item.id, { ...item, collection: 'seller_add_item_preloved' });
      });
      
      // Add barter items (will not override if ID already exists)
      (barterResult.data || []).forEach(item => {
        if (!itemsMap.has(item.id)) {
          itemsMap.set(item.id, { ...item, collection: 'seller_add_barter_item' });
        }
      });

      // Convert Map to array
      const items = Array.from(itemsMap.values());

      // Sort by created_at
      items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      console.log(`✅ [ItemService] Found ${items.length} unique items for seller ${sellerId}`);

      return { success: true, data: items };
    } catch (error) {
      console.error('Get items by seller error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Search items across both collections
  async searchItems(filters = {}, pageSize = 20, lastDoc = null) {
    try {
      const collections = ['seller_add_item_preloved', 'seller_add_barter_item'];
      const allItems = [];

      // Query both collections
      for (const collectionName of collections) {
        let query = supabase.from(collectionName).select('*');

        // Apply filters
        if (filters.category) {
          query = query.eq('category', filters.category);
        }

        if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
          query = query.gte('price', filters.minPrice).lte('price', filters.maxPrice);
        }

        if (filters.location) {
          query = query.eq('location', filters.location);
        }

        if (filters.isBarterOnly !== undefined) {
          // Only query barter collection if barter-only filter is set
          if (filters.isBarterOnly && collectionName !== 'seller_add_barter_item') {
            continue;
          }
          if (!filters.isBarterOnly && collectionName === 'seller_add_barter_item') {
            continue;
          }
        }

        if (filters.status) {
          query = query.eq('status', filters.status);
        } else {
          query = query.eq('status', 'active');
        }

        // Order by creation date and limit
        query = query.order('created_at', { ascending: false }).limit(pageSize);

        const { data, error } = await query;

        if (error) throw error;

        allItems.push(...(data || []).map(item => ({ ...item, collection: collectionName })));
      }

      // Sort combined results by created_at
      allItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Trim to page size
      const items = allItems.slice(0, pageSize);

      return {
        success: true,
        data: items,
        hasMore: allItems.length > pageSize
      };
    } catch (error) {
      console.error('Search items error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Update item
  async updateItem(itemId, updates, collectionName = null) {
    try {
      // If collection not provided, try to find item
      if (!collectionName) {
        const itemResult = await this.getItem(itemId);
        if (!itemResult.success) {
          return itemResult;
        }
        collectionName = itemResult.data.collection;
      }

      // Convert camelCase to snake_case
      const snakeCaseUpdates = {};
      for (const [key, value] of Object.entries(updates)) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        snakeCaseUpdates[snakeKey] = value;
      }
      snakeCaseUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from(collectionName)
        .update(snakeCaseUpdates)
        .eq('id', itemId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Update item error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Delete item images from Storage
  async deleteItemImages(imageUrls) {
    try {
      if (!imageUrls || imageUrls.length === 0) {
        return { success: true };
      }

      const deletePromises = imageUrls.map(async (imageUrl) => {
        try {
          // Extract storage path from URL
          const url = new URL(imageUrl);
          const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);

          if (pathMatch && pathMatch[1]) {
            const imagePath = decodeURIComponent(pathMatch[1]);
            const { error } = await supabase.storage
              .from('items')
              .remove([imagePath]);

            if (error) console.error('Delete single image error:', error);
          }
        } catch (err) {
          console.error('Delete single image error:', err);
          // Continue with other images even if one fails
        }
      });

      await Promise.allSettled(deletePromises);

      return { success: true };
    } catch (error) {
      console.error('Delete item images error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Delete item
  async deleteItem(itemId, collectionName = null) {
    try {
      // If collection not provided, try to find item
      if (!collectionName) {
        const itemResult = await this.getItem(itemId);
        if (!itemResult.success) {
          return itemResult;
        }
        collectionName = itemResult.data.collection;
      }

      // Get item data to access image URLs
      const { data: itemData, error: fetchError } = await supabase
        .from(collectionName)
        .select('*')
        .eq('id', itemId)
        .single();

      if (fetchError) throw fetchError;

      // Delete associated images from storage
      if (itemData && itemData.images && itemData.images.length > 0) {
        await this.deleteItemImages(itemData.images);
      }

      // Delete the item document
      const { error } = await supabase
        .from(collectionName)
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Delete item error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Create barter request
  async createBarterRequest(itemId, buyerId, offerData) {
    try {
      // Find which collection the item is in
      const itemResult = await this.getItem(itemId);
      if (!itemResult.success) {
        return itemResult;
      }

      const item = itemResult.data;
      const barterRequests = item.barter_requests || [];

      barterRequests.push({
        buyer_id: buyerId,
        offer_items: offerData.offerItems || [],
        offer_description: offerData.offerDescription || '',
        offer_value: offerData.offerValue || 0,
        message: offerData.message || '',
        status: 'pending', // pending, accepted, rejected, withdrawn
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const { error } = await supabase
        .from(item.collection)
        .update({ barter_requests: barterRequests, updated_at: new Date().toISOString() })
        .eq('id', itemId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Create barter request error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Respond to barter request
  async respondToBarterRequest(itemId, requestIndex, response, sellerMessage = '') {
    try {
      // Find which collection the item is in
      const itemResult = await this.getItem(itemId);
      if (!itemResult.success) {
        return itemResult;
      }

      const item = itemResult.data;
      const barterRequests = item.barter_requests || [];

      if (requestIndex >= barterRequests.length) {
        return { success: false, error: 'Invalid request index' };
      }

      barterRequests[requestIndex] = {
        ...barterRequests[requestIndex],
        status: response, // 'accepted' or 'rejected'
        seller_message: sellerMessage,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from(item.collection)
        .update({ barter_requests: barterRequests, updated_at: new Date().toISOString() })
        .eq('id', itemId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Respond to barter request error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Mark item as sold/bartered
  async updateItemStatus(itemId, status, transactionDetails = {}) {
    try {
      // Find which collection the item is in
      const itemResult = await this.getItem(itemId);
      if (!itemResult.success) {
        return itemResult;
      }

      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...transactionDetails
      };

      if (status === 'sold') {
        updateData.sold_at = new Date().toISOString();
      } else if (status === 'bartered') {
        updateData.bartered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from(itemResult.data.collection)
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Update item status error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Increment item views
  async incrementItemViews(itemId) {
    try {
      // Find which collection the item is in
      const itemResult = await this.getItem(itemId);
      if (!itemResult.success) {
        return itemResult;
      }

      const currentViews = itemResult.data.views || 0;

      const { error } = await supabase
        .from(itemResult.data.collection)
        .update({ views: currentViews + 1 })
        .eq('id', itemId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Increment views error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Get featured items
  async getFeaturedItems(limitCount = 10) {
    try {
      const collections = ['seller_add_item_preloved', 'seller_add_barter_item'];
      const allItems = [];

      // Query both collections
      for (const collectionName of collections) {
        const { data, error } = await supabase
          .from(collectionName)
          .select('*')
          .eq('is_featured', true)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(limitCount);

        if (error) throw error;

        allItems.push(...(data || []).map(item => ({ ...item, collection: collectionName })));
      }

      // Sort and limit
      allItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return { success: true, data: allItems.slice(0, limitCount) };
    } catch (error) {
      console.error('Get featured items error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Get items by category
  async getItemsByCategory(category, limitCount = 20) {
    try {
      const collections = ['seller_add_item_preloved', 'seller_add_barter_item'];
      const allItems = [];

      // Query both collections
      for (const collectionName of collections) {
        const { data, error } = await supabase
          .from(collectionName)
          .select('*')
          .eq('category', category)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(limitCount);

        if (error) throw error;

        allItems.push(...(data || []).map(item => ({ ...item, collection: collectionName })));
      }

      // Sort and limit
      allItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return { success: true, data: allItems.slice(0, limitCount) };
    } catch (error) {
      console.error('Get items by category error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Search items by name (for search autocomplete)
  async searchItemsByName(searchTerm, limitCount = 10) {
    try {
      if (!searchTerm || searchTerm.length < 2) {
        return { success: true, data: [] };
      }

      const collections = ['seller_add_item_preloved', 'seller_add_barter_item'];
      const allItems = [];
      const searchLower = searchTerm.toLowerCase();

      // Query both collections
      for (const collectionName of collections) {
        const { data, error } = await supabase
          .from(collectionName)
          .select('*')
          .eq('status', 'active')
          .ilike('name', `%${searchTerm}%`)
          .order('name')
          .limit(limitCount);

        if (error) throw error;

        allItems.push(...(data || []).map(item => ({ ...item, collection: collectionName })));
      }

      return { success: true, data: allItems.slice(0, limitCount) };
    } catch (error) {
      console.error('Search items by name error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }
}

export default new ItemService();
