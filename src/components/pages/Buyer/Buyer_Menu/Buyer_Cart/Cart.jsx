/**
 * Cart Page Component
 * 
 * This component follows the ChiFere design system established in /styles/designSystem.js
 * 
 * Design System Usage:
 * - Colors: Uses theme.colors tokens for consistent branding
 * - Typography: Applies theme.typography for font sizes and weights
 * - Spacing: Uses theme.spacing for consistent margins and padding
 * - Shadows: Applies theme.shadows for card elevation
 * - Border Radius: Uses theme.borderRadius for consistent corners
 * - Animations: Uses theme.animations for smooth transitions
 * - Components: Leverages theme.components for button and card styling
 * 
 * Key Features:
 * - Modern card-based design consistent with Landing/Checkout pages
 * - Fully responsive design using Tailwind breakpoints
 * - Interactive elements with hover states and animations
 * - Separate handling for Preloved and Barter items
 * - Proper focus states for accessibility
 * 
 * Firebase Integration Notes:
 * - Demo cart data marked with TODO comments for Firebase implementation
 * - Cart state will be synchronized with Firestore
 * - Store messaging will connect to Firebase messaging service
 * 
 * @version 2.0.0 - Complete redesign using design system
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useCart } from '../../../../../contexts/CartContext';
// import { useMessaging } from '../../../../../contexts/MessagingContext'; // Removed to fix cart loading
import { useToast } from '../../../../../components/Toast';
import BuyerLayout from '../Buyer_Layout/Buyer_layout';
import theme from '../../../../../styles/designSystem';

const CartSection = ({
  title,
  cart,
  selected,
  setSelected,
  handleRemove,
  handleSelectAll,
  handleSelect,
  handleDeleteSelected,
  allSelected,
  total,
  isBarter,
  navigate,
  updateQuantity
}) => {
  const hasSelection = Object.values(selected || {}).some(Boolean);

  return (
  <div className="mb-8">
    {/* Section Header */}
    <h3 
      className="text-2xl font-bold mb-6"
      style={{ color: theme.colors.gray[800] }}
    >
      {title}
    </h3>

    {/* Items Container */}
    <div 
      className="overflow-hidden mb-6"
      style={{
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius['2xl'],
        boxShadow: theme.shadows.lg,
        border: `1px solid ${theme.colors.gray[200]}`
      }}
    >
      {cart.map((store, storeIdx) => (
        <div key={store.store} className="border-b last:border-b-0" style={{ borderColor: theme.colors.gray[100] }}>
          {/* Store Header */}
          <div 
            className="p-6 border-b"
            style={{ 
              backgroundColor: theme.colors.primary[50],
              borderColor: theme.colors.gray[200]
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input 
                  type="checkbox"
              checked={store.items.every(item => selected[item.id])}
              onChange={() => {
                const allChecked = store.items.every(item => selected[item.id]);
                setSelected(prev => {
                  const newSel = { ...prev };
                  store.items.forEach(item => { newSel[item.id] = !allChecked; });
                  return newSel;
                });
              }}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: theme.colors.primary[600] }}
                />
                <span 
                  className="text-lg font-semibold"
                  style={{ color: theme.colors.gray[800] }}
                >
                  {store.store}
                </span>
              </div>
            </div>
          </div>

          {/* Store Items */}
          <div className="space-y-0">
            {store.items.map((item, itemIdx) => (
              <div 
                key={item.id} 
                className="p-6 border-b last:border-b-0 transition-all duration-200"
                style={{ borderColor: theme.colors.gray[100] }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = theme.colors.gray[50];
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = theme.colors.white;
                }}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                  {/* Checkbox & Image */}
                  <div className="flex items-center space-x-4">
                    <input 
                      type="checkbox" 
                      checked={!!selected[item.id]} 
                      onChange={() => handleSelect(item.id)} 
                      className="w-5 h-5 rounded"
                      style={{ accentColor: theme.colors.primary[600] }}
                    />
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-24 h-24 object-cover"
                      style={{ borderRadius: theme.borderRadius.lg }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 
                      className="text-lg font-semibold mb-2 line-clamp-2"
                      style={{ color: theme.colors.gray[800] }}
                    >
                      {item.name}
                    </h4>
                    
                    {/* Price */}
                    <div className="mb-3">
                      {isBarter ? (
                        <span 
                          className="text-xl font-bold px-3 py-1 rounded-full"
                          style={{ 
                            backgroundColor: theme.colors.secondary[100],
                            color: theme.colors.secondary[700]
                          }}
                        >
                          🔄 Barter Only
                        </span>
                      ) : (
                        <span 
                          className="text-2xl font-bold"
                          style={{ color: theme.colors.primary[600] }}
                        >
                          ₱{item.price.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3 mb-4">
                      <span 
                        className="text-sm font-medium"
                        style={{ color: theme.colors.gray[600] }}
                      >
                        Quantity:
                      </span>
                      <div 
                        className="flex items-center border rounded-lg"
                        style={{ borderColor: theme.colors.gray[300] }}
                      >
                        <button 
                          className="p-2 transition-colors duration-200 hover:bg-gray-100"
                          style={{ color: theme.colors.gray[600] }}
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(item.id, item.quantity - 1);
                            }
                          }}
                        >
                          −
                        </button>
                        <span 
                          className="px-4 py-2 min-w-[3rem] text-center"
                          style={{ color: theme.colors.gray[800] }}
                        >
                          {item.quantity}
                        </span>
                        <button 
                          className="p-2 transition-colors duration-200 hover:bg-gray-100"
                          style={{ color: theme.colors.gray[600] }}
                          onClick={() => {
                            updateQuantity(item.id, item.quantity + 1);
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Total & Actions */}
                  <div className="flex flex-col items-end space-y-4">
                    <div className="text-right">
                      <div 
                        className="text-sm"
                        style={{ color: theme.colors.gray[600] }}
                      >
                        Total
                      </div>
                      <div 
                        className="text-xl font-bold"
                        style={{ color: theme.colors.primary[600] }}
                      >
                        {isBarter ? `₱${(item.price * item.quantity).toLocaleString()}` : `₱${(item.price * item.quantity).toLocaleString()}`}
                      </div>
                      {isBarter && (
                        <div 
                          className="text-xs mt-1"
                          style={{ color: theme.colors.secondary[600] }}
                        >
                          Barter only
                        </div>
                      )}
              </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        className="px-3 py-2 rounded-lg font-medium transition-all duration-200"
                        style={{
                          color: theme.colors.error[600],
                          backgroundColor: 'transparent',
                          border: `1px solid ${theme.colors.error[200]}`
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = theme.colors.error[50];
                          e.target.style.borderColor = theme.colors.error[300];
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.borderColor = theme.colors.error[200];
                        }}
                        onClick={() => handleRemove(storeIdx, item.id)}
                      >
                        🗑️ Remove
                      </button>
                    </div>
              </div>
              </div>
              </div>
            ))}
            </div>
        </div>
      ))}
    </div>

    {/* Section Footer */}
    <div 
      className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl"
      style={{
        backgroundColor: theme.colors.gray[50],
        border: `1px solid ${theme.colors.gray[200]}`
      }}
    >
      {/* Bulk Actions */}
      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={allSelected} 
            onChange={handleSelectAll} 
            className="w-5 h-5 rounded"
            style={{ accentColor: theme.colors.primary[600] }}
          />
          <span 
            className="font-medium"
            style={{ color: theme.colors.gray[700] }}
          >
            Select All
          </span>
        </label>
        <button 
          className="px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            color: theme.colors.error[600],
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            if (!hasSelection) return;
            e.target.style.backgroundColor = theme.colors.error[50];
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
          onClick={handleDeleteSelected}
          disabled={!hasSelection}
        >
          🗑️ Delete Selected
        </button>
      </div>

      {/* Total & Checkout */}
      <div className="flex items-center space-x-6">
        <div className="text-right">
          <div 
            className="text-sm"
            style={{ color: theme.colors.gray[600] }}
          >
            Total Amount
          </div>
          <div 
            className="text-2xl font-bold"
            style={{ color: theme.colors.primary[600] }}
          >
            {isBarter ? `₱${total.toLocaleString()}` : `₱${total.toLocaleString()}`}
          </div>
          {isBarter && (
            <div 
              className="text-sm mt-1"
              style={{ color: theme.colors.secondary[600] }}
            >
              Barter only
            </div>
          )}
        </div>
        <button 
          className="px-8 py-3 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105"
          style={{
            background: `linear-gradient(to right, ${theme.colors.primary[600]}, ${theme.colors.primary[500]})`,
            color: theme.colors.white,
            boxShadow: theme.shadows.lg
          }}
          onMouseEnter={(e) => {
            e.target.style.background = `linear-gradient(to right, ${theme.colors.primary[700]}, ${theme.colors.primary[600]})`;
          }}
          onMouseLeave={(e) => {
            e.target.style.background = `linear-gradient(to right, ${theme.colors.primary[600]}, ${theme.colors.primary[500]})`;
          }}
          onClick={() => {
            // Navigate to checkout with selected items
            const selectedItems = cart.flatMap(store => 
              store.items.filter(item => selected[item.id])
            );
            if (selectedItems.length > 0) {
              navigate('/checkout', { 
                state: { 
                  selectedItems,
                  isBarter,
                  total: isBarter ? 0 : total 
                }
              });
            } else {
              alert('Please select items to checkout');
            }
          }}
        >
          🛒 Check Out
        </button>
      </div>
    </div>
  </div>
);
};

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, loading, removeFromCart, updateQuantity } = useCart();
  // const { createConversation } = useMessaging(); // Removed to fix cart loading
  const { showToast } = useToast();
  const [tab, setTab] = useState('all'); // 'all', 'preloved', 'barter'

  // Debug cart data
  useEffect(() => {
    console.log('🛒 [Cart] Cart data received:', cart);
    console.log('🛒 [Cart] Cart loading:', loading);
    console.log('🛒 [Cart] Cart length:', cart?.length || 0);
  }, [cart, loading]);

  // Selection state
  const [prelovedSelected, setPrelovedSelected] = useState({});
  const [barterSelected, setBarterSelected] = useState({});


  // Group cart items by seller and type
  const groupCartBySeller = (items, isBarter) => {
    const grouped = {};

    items
      .filter(item => isBarter ? (item.isBarter || item.orderType === 'barter') : !(item.isBarter || item.orderType === 'barter'))
      .forEach(item => {
        const sellerId = item.sellerId || item.storeId || 'unknown';
        const storeName = item.sellerName || item.storeName || 'Store';

        if (!grouped[sellerId]) {
          grouped[sellerId] = {
            store: storeName,
            items: []
          };
        }

        grouped[sellerId].items.push({
          id: item.id || item.itemId,
          name: item.name || item.itemName || 'Product',
          price: item.price || 0,
          quantity: item.quantity || 1,
          image: item.image || item.imageUrl || '/placeholder.png',
          barter: item.isBarter || item.orderType === 'barter' || false
        });
      });

    return Object.values(grouped);
  };

  const prelovedCart = groupCartBySeller(cart, false);
  const barterCart = groupCartBySeller(cart, true);

  const prelovedAllItemIds = prelovedCart.flatMap(store => store.items.map(item => item.id));
  const prelovedAllSelected = prelovedAllItemIds.length > 0 && prelovedAllItemIds.every(id => prelovedSelected[id]);

  const barterAllItemIds = barterCart.flatMap(store => store.items.map(item => item.id));
  const barterAllSelected = barterAllItemIds.length > 0 && barterAllItemIds.every(id => barterSelected[id]);

  const handlePrelovedSelectAll = () => {
    if (prelovedAllSelected) {
      setPrelovedSelected({});
    } else {
      const newSelected = {};
      prelovedAllItemIds.forEach(id => { newSelected[id] = true; });
      setPrelovedSelected(newSelected);
    }
  };

  const handlePrelovedSelect = (id) => {
    setPrelovedSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrelovedRemove = async (storeIdx, itemId) => {
    await removeFromCart(itemId);
    setPrelovedSelected(prev => {
      const newSel = { ...prev };
      delete newSel[itemId];
      return newSel;
    });
  };

  const handlePrelovedDeleteSelected = async () => {
    const selectedIds = Object.entries(prelovedSelected)
      .filter(([, isChecked]) => isChecked)
      .map(([itemId]) => itemId);

    if (selectedIds.length === 0) {
      return;
    }

    try {
      for (const itemId of selectedIds) {
        await removeFromCart(itemId);
      }
      setPrelovedSelected(prev => {
        const newSel = { ...prev };
        selectedIds.forEach(id => {
          delete newSel[id];
        });
        return newSel;
      });
      showToast('Selected preloved items removed from cart.', 'success');
    } catch (error) {
      console.error('Failed to remove selected preloved items:', error);
      showToast('Failed to delete selected items. Please try again.', 'error');
    }
  };

  const prelovedTotal = prelovedCart.reduce((sum, store) =>
    sum + store.items.reduce((s, item) => s + (prelovedSelected[item.id] ? item.price * item.quantity : 0), 0)
  , 0);

  const handleBarterSelectAll = () => {
    if (barterAllSelected) {
      setBarterSelected({});
    } else {
      const newSelected = {};
      barterAllItemIds.forEach(id => { newSelected[id] = true; });
      setBarterSelected(newSelected);
    }
  };

  const handleBarterSelect = (id) => {
    setBarterSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBarterRemove = async (storeIdx, itemId) => {
    await removeFromCart(itemId);
    setBarterSelected(prev => {
      const newSel = { ...prev };
      delete newSel[itemId];
      return newSel;
    });
  };

  const handleBarterDeleteSelected = async () => {
    const selectedIds = Object.entries(barterSelected)
      .filter(([, isChecked]) => isChecked)
      .map(([itemId]) => itemId);

    if (selectedIds.length === 0) {
      return;
    }

    try {
      for (const itemId of selectedIds) {
        await removeFromCart(itemId);
      }
      setBarterSelected(prev => {
        const newSel = { ...prev };
        selectedIds.forEach(id => {
          delete newSel[id];
        });
        return newSel;
      });
      showToast('Selected barter items removed from cart.', 'success');
    } catch (error) {
      console.error('Failed to remove selected barter items:', error);
      showToast('Failed to delete selected items. Please try again.', 'error');
    }
  };

  const barterTotal = barterCart.reduce((sum, store) =>
    sum + store.items.reduce((s, item) => s + (barterSelected[item.id] ? item.price * item.quantity : 0), 0)
  , 0);

  return (
    <BuyerLayout>
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.accent }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary[600]} 0%, ${theme.colors.primary[500]} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              🛒 My Shopping Cart
            </h1>
            <p style={{ color: theme.colors.gray[600] }} className="text-lg">
              Review and manage your selected items
            </p>
          </div>

          {/* Tab Navigation */}
          <div 
            className="flex flex-col sm:flex-row gap-3 mb-8 p-2 rounded-2xl"
            style={{
              backgroundColor: theme.colors.white,
              boxShadow: theme.shadows.lg,
              border: `1px solid ${theme.colors.gray[200]}`
            }}
          >
            {[
              { key: 'all', label: '📦 All Items', count: prelovedCart.length + barterCart.length },
              { key: 'preloved', label: '♻️ Preloved Items', count: prelovedCart.length },
              { key: 'barter', label: '🔄 Barter Items', count: barterCart.length }
            ].map((tabItem) => (
              <button 
                key={tabItem.key}
                onClick={() => setTab(tabItem.key)} 
                className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 relative"
                style={{
                  backgroundColor: tab === tabItem.key ? theme.colors.primary[600] : 'transparent',
                  color: tab === tabItem.key ? theme.colors.white : theme.colors.gray[700],
                  border: tab === tabItem.key ? 'none' : `1px solid transparent`
                }}
                onMouseEnter={(e) => {
                  if (tab !== tabItem.key) {
                    e.target.style.backgroundColor = theme.colors.gray[50];
                  }
                }}
                onMouseLeave={(e) => {
                  if (tab !== tabItem.key) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>{tabItem.label}</span>
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: tab === tabItem.key ? theme.colors.white : theme.colors.primary[100],
                      color: tab === tabItem.key ? theme.colors.primary[600] : theme.colors.primary[700]
                    }}
                  >
                    {tabItem.count}
                  </span>
                </span>
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"
                style={{ borderColor: theme.colors.primary[600] }}
              ></div>
              <h3
                className="text-2xl font-semibold mb-2"
                style={{ color: theme.colors.gray[400] }}
              >
                Loading your cart...
              </h3>
              <p style={{ color: theme.colors.gray[500] }}>
                Please wait while we fetch your items
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading && prelovedCart.length === 0 && barterCart.length === 0 && (
            <div className="text-center py-20">
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8"
                style={{
                  background: `linear-gradient(to bottom right, ${theme.colors.gray[100]}, ${theme.colors.gray[200]})`
                }}
              >
                <span className="text-6xl">🛒</span>
              </div>
              <h3
                className="text-3xl font-bold mb-4"
                style={{ color: theme.colors.gray[400] }}
              >
                Your cart is empty
              </h3>
              <p
                className="mb-8 text-lg"
                style={{ color: theme.colors.gray[500] }}
              >
                Start adding items you love to your cart
              </p>
              <button
                onClick={() => window.location.href = '/buyer/dashboard'}
                className="px-8 py-4 rounded-xl font-semibold transform hover:scale-105 text-lg transition-all duration-200"
                style={{
                  background: `linear-gradient(to right, ${theme.colors.primary[600]}, ${theme.colors.primary[500]})`,
                  color: theme.colors.white,
                  boxShadow: theme.shadows.lg
                }}
              >
                🛍️ Start Shopping
              </button>
        </div>
          )}

          {/* Cart Content */}
          {(tab === 'all' || tab === 'preloved') && prelovedCart.length > 0 && (
          <CartSection
              title="♻️ Preloved Items"
            cart={prelovedCart}
            selected={prelovedSelected}
            setSelected={setPrelovedSelected}
            handleRemove={handlePrelovedRemove}
            handleSelectAll={handlePrelovedSelectAll}
            handleSelect={handlePrelovedSelect}
            handleDeleteSelected={handlePrelovedDeleteSelected}
            allSelected={prelovedAllSelected}
            total={prelovedTotal}
            isBarter={false}
            navigate={navigate}
            updateQuantity={updateQuantity}
          />
        )}
          {(tab === 'all' || tab === 'barter') && barterCart.length > 0 && (
          <CartSection
              title="🔄 Barter Items"
            cart={barterCart}
            selected={barterSelected}
            setSelected={setBarterSelected}
            handleRemove={handleBarterRemove}
            handleSelectAll={handleBarterSelectAll}
            handleSelect={handleBarterSelect}
            handleDeleteSelected={handleBarterDeleteSelected}
            allSelected={barterAllSelected}
            total={barterTotal}
            isBarter={true}
            navigate={navigate}
            updateQuantity={updateQuantity}
          />
        )}
        </div>
      </div>
    </BuyerLayout>
  );
};

export default Cart;

// Add line-clamp styles
const styles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
