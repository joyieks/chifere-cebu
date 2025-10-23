/**
 * CartContext - Shopping cart state management for ChiFere marketplace
 *
 * Provides cart functionality with Supabase persistence for authenticated users
 * and localStorage fallback for guest users. Supports real-time synchronization
 * across devices using Supabase realtime channels.
 *
 * @version 2.0.0 - Migrated to Supabase
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import cartService from '../services/cartService';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cartSynced, setCartSynced] = useState(false);

  // DATABASE ONLY - No localStorage!
  // Cart is ONLY stored in database for logged-in users
  // Guest users (not logged in) will have empty cart

  // Sync cart with Supabase when user logs in (ONLY for buyers)
  useEffect(() => {
    if (!user || cartSynced) return;
    
    // Skip cart sync for sellers - they don't need cart functionality
    if (user.role === 'seller' || user.user_type === 'seller') {
      console.log('🛒 [CartContext] Skipping cart sync for seller user');
      setCartSynced(true);
      return;
    }

    const syncUserCart = async () => {
      setLoading(true);
      try {
        console.log('🛒 [CartContext] Syncing cart for user:', user.id, user.email);
        
        // DATABASE ONLY - No guest cart merge
        // Just load user's cart from database
        console.log('🛒 [CartContext] Loading user cart from database');
        const result = await cartService.getUserCart(user.id);
        if (result.success) {
          console.log('🛒 [CartContext] User cart loaded:', result.data.items.length, 'items');
          setCart(result.data.items || []);
        } else {
          console.error('🛒 [CartContext] Failed to load user cart:', result.error);
          setCart([]);
        }

        setCartSynced(true);
        console.log('🛒 [CartContext] Cart sync completed');
      } catch (error) {
        console.error('🛒 [CartContext] Cart sync error:', error);
        setCart([]);
      } finally {
        setLoading(false);
      }
    };

    syncUserCart();
  }, [user, cartSynced]);

  // Listen to real-time cart updates via Supabase channels for authenticated users (ONLY for buyers)
  useEffect(() => {
    if (!user || !cartSynced) return;
    
    // Skip cart realtime for sellers - they don't need cart functionality
    if (user.role === 'seller' || user.user_type === 'seller') {
      return;
    }

    // Subscribe to Supabase realtime channel for cart updates
    const unsubscribe = cartService.listenToCart(user.id, (result) => {
      if (result.success) {
        setCart(result.data.items || []);
      } else {
        console.error('Cart update error:', result.error);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, cartSynced]);

  // Reset cart sync flag when user logs out (but keep cart in database!)
  useEffect(() => {
    if (!user && cartSynced) {
      console.log('🛒 [CartContext] User logged out, resetting sync flag (cart stays in database)');
      setCartSynced(false);
      // DON'T clear cart state here - it will be loaded from localStorage for guest
      // and from database when user logs back in
      // Only load guest cart from localStorage
      const savedCart = localStorage.getItem('chifere_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      } else {
        setCart([]);
      }
    }
  }, [user, cartSynced]);

  const addToCart = async (item, quantity = 1) => {
    console.log('🛒 [CartContext] addToCart called:', { item: item.name, quantity, userId: user?.id });
    
    if (user) {
      // Skip cart operations for sellers - they don't need cart functionality
      if (user.role === 'seller' || user.user_type === 'seller') {
        console.log('🛒 [CartContext] Skipping addToCart for seller user');
        return;
      }
      
      // Authenticated user: DATABASE ONLY (no localStorage fallback)
      setLoading(true);
      try {
        console.log('🛒 [CartContext] Adding to database cart for user:', user.id);
        const result = await cartService.addToCart(user.id, item, quantity);
        console.log('🛒 [CartContext] Database cart result:', result);
        
        if (result.success) {
          console.log('🛒 [CartContext] Item added to database successfully');
          setCart(result.data.items);
        } else {
          console.error('🛒 [CartContext] Failed to add to database:', result.error);
          // Check if it's a cart limit error
          if (result.error && result.error.includes('Maximum') && result.error.includes('items allowed')) {
            alert(result.error); // Show the specific limit error message
          } else {
            alert('Failed to add item to cart. Please try again.');
          }
        }
      } catch (error) {
        console.error('🛒 [CartContext] Add to cart error:', error);
        alert('Error adding to cart. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // Guest user: must login to use cart
      console.log('🛒 [CartContext] Guest user must login to use cart');
      alert('Please login to add items to cart.');
    }
  };

  const removeFromCart = async (itemId) => {
    if (user) {
      // Authenticated user: DATABASE ONLY
      setLoading(true);
      try {
        const result = await cartService.removeFromCart(user.id, itemId);
        if (result.success) {
          setCart(result.data.items);
        } else {
          console.error('Failed to remove from database');
          alert('Failed to remove item. Please try again.');
        }
      } catch (error) {
        console.error('Remove from cart error:', error);
        alert('Error removing item. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // Guest user: must login
      alert('Please login to manage cart.');
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    if (user) {
      // Authenticated user: DATABASE ONLY
      setLoading(true);
      try {
        const result = await cartService.updateQuantity(user.id, itemId, quantity);
        if (result.success) {
          setCart(result.data.items);
        } else {
          console.error('Failed to update quantity in database:', result.error);
          // Check if it's a cart limit error
          if (result.error && result.error.includes('Maximum') && result.error.includes('items allowed')) {
            alert(result.error); // Show the specific limit error message
          } else {
            alert('Failed to update quantity. Please try again.');
          }
        }
      } catch (error) {
        console.error('Update quantity error:', error);
        alert('Error updating quantity. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // Guest user: must login
      alert('Please login to manage cart.');
    }
  };

  const clearCart = async () => {
    if (user) {
      // Authenticated user: clear Supabase cart
      setLoading(true);
      try {
        const result = await cartService.clearCart(user.id);
        if (result.success) {
          setCart([]);
        }
      } catch (error) {
        console.error('Clear cart error:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Guest user: clear local state
      setCart([]);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const getCartLimitInfo = () => {
    const currentItems = cart.reduce((count, item) => count + item.quantity, 0);
    const maxItems = 20;
    const remainingSlots = maxItems - currentItems;
    const isAtLimit = currentItems >= maxItems;
    
    return {
      currentItems,
      maxItems,
      remainingSlots: Math.max(0, remainingSlots),
      isAtLimit,
      uniqueItems: cart.length
    };
  };

  const value = {
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getCartLimitInfo
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 