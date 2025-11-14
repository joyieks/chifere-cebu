import React, { useState, useEffect } from 'react';
import BuyerLayout from '../Buyer_Layout/Buyer_layout';
import { useNavigate } from 'react-router-dom';
import { theme } from '../../../../../styles/designSystem';
import productService from '../../../../../services/productService';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useCart } from '../../../../../contexts/CartContext';
import { useToast } from '../../../../../components/Toast';
import { MessagingProvider } from '../../../../../contexts/MessagingContext';
import OfferModal from '../../../Shared/OfferModal/OfferModal';

const Buyer_Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, loading: cartLoading } = useCart();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [error, setError] = useState(null);
  const [addingProductId, setAddingProductId] = useState(null);

  // Load products from database
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all active products from sellers
      const result = await productService.getAllActiveProducts();
      
      if (result.success) {
        console.log('📦 Products loaded successfully:', result.data?.length || 0);
        console.log('📦 Sample product IDs:', result.data?.slice(0, 3).map(p => ({ id: p.id, name: p.name })));
        setProducts(result.data || []);
      } else {
        console.error('❌ Failed to load products:', result.error);
        setError(result.error || 'Failed to load products');
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Use all products since we removed category filtering
  const filteredProducts = products;



  const handleProductClick = (product) => {
    console.log('🛍️ Product clicked:', product);
    console.log('🛍️ Product ID:', product.id);
    console.log('🛍️ Navigating to:', `/item/${product.id}`);
    navigate(`/item/${product.id}`);
  };

  const handleAddToCart = async (product) => {
    if (!user) {
      showToast('Please log in to add items to cart', 'error');
      navigate('/login');
      return;
    }

    if (cartLoading) {
      return;
    }

    setAddingProductId(product.id);

    try {
      const isBarter = product.selling_mode === 'barter' ||
        product.product_type === 'barter' ||
        product.is_barter_only === true ||
        product.collection === 'seller_addBarterItem';
      const orderType = isBarter ? 'barter' : 'purchase';

      const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price || 0,
        image: product.primary_image || product.images?.[0] || '',
        sellerId: product.seller_id || '',
        sellerName: product.user_profiles?.business_name || product.user_profiles?.display_name || 'Store',
        category: product.category,
        quantity: 1,
        isBarter,
        orderType,
        sellingMode: product.selling_mode,
        productType: product.product_type,
        collection: product.collection
      };
      
      await addToCart(cartItem, 1);
      showToast(`${product.name} added to cart!`, 'success');
      console.log('✅ Item added to cart:', product.name);
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      showToast('Failed to add item to cart', 'error');
    } finally {
      setAddingProductId(null);
    }
  };

  const handleMakeOffer = async (product) => {
    console.log('🛍️ [BuyerDashboard] Make Offer clicked for product:', product);
    
    if (!user) {
      console.log('❌ [BuyerDashboard] No user found');
      showToast('Please log in to make an offer', 'error');
      navigate('/login');
      return;
    }

    try {
      console.log('🔄 [BuyerDashboard] Opening offer modal...');
      
      // Get store information for the product
      const storeData = {
        id: product.seller_id,
        business_name: product.user_profiles?.business_name || 'Store',
        display_name: product.user_profiles?.display_name || 'Store'
      };

      console.log('📦 [BuyerDashboard] Store data:', storeData);
      console.log('📦 [BuyerDashboard] Product data:', product);

      setSelectedProduct(product);
      setSelectedStore(storeData);
      setIsOfferModalOpen(true);
      
      console.log('✅ [BuyerDashboard] Offer modal should be open now');
    } catch (error) {
      console.error('❌ [BuyerDashboard] Error opening offer modal:', error);
      showToast('Failed to open offer modal', 'error');
    }
  };


  // Show loading state
  if (loading) {
    return (
      <BuyerLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <BuyerLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={loadProducts}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto px-6 py-16">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
                Welcome to <span style={{ color: theme.colors.primary[500] }}>ChiFere</span><span style={{ color: theme.colors.success[500] }}> Cebu</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100 animate-slide-up">
                Discover amazing preloved items and barter opportunities
              </p>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
            <div className="absolute top-32 -left-8 w-20 h-20 bg-white/10 rounded-full animate-float animate-delay-1s"></div>
            <div className="absolute bottom-16 right-32 w-24 h-24 bg-white/10 rounded-full animate-float animate-delay-2s"></div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">

          {/* Products */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">All Products</h2>
              <div className="text-sm text-gray-600">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
              </div>
            </div>
            
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No Products Found</h3>
                <p className="text-gray-600 mb-6">
                  No products are available at the moment. Check back later!
                </p>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  onClick={(e) => {
                    // Only handle click if it's not from a button or div with onClick
                    if (!e.target.closest('button') && !e.target.closest('div[onClick]')) {
                      console.log('🖱️ [BuyerDashboard] Product card clicked for:', product.name);
                      handleProductClick(product);
                    }
                  }}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Product Image */}
                  <div className="relative overflow-hidden">
                    <img
                      src={product.primary_image || (product.images && product.images[0]) || 'https://via.placeholder.com/400x300?text=No+Image'}
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col space-y-2">
                      {product.status === 'sold' && (
                        <span className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wide">
                          SOLD
                        </span>
                      )}
                      {product.selling_mode === 'barter' && product.status !== 'sold' && (
                        <span className="bg-orange-500 text-white px-2 py-1 rounded-lg text-sm font-semibold">
                          Barter
                        </span>
                      )}
                    </div>
                    
                    {/* Condition Badge */}
                    <div className="absolute top-3 right-3">
                      {product.status !== 'sold' && (
                        <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                          {product.condition}
                        </span>
                      )}
                    </div>
                    
                    {/* Wishlist Button */}
                    <button className="absolute bottom-3 right-3 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {product.user_profiles?.business_name || 
                       product.user_profiles?.display_name || 
                       'Unknown Seller'}
                    </p>
                    
                    {/* Rating - Using hardcoded for now since we don't have reviews yet */}
                    <div className="flex items-center mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">(0)</span>
                    </div>
                    
                    {/* Price */}
                    <div className="mb-4">
                      {product.status === 'sold' ? (
                        <div>
                          <p className="text-2xl font-bold text-red-600">SOLD</p>
                          <p className="text-sm text-gray-500 line-through">₱{product.price?.toLocaleString() || '0'}</p>
                        </div>
                      ) : product.selling_mode === 'barter' ? (
                        <div>
                          <p className="text-lg font-bold text-orange-600">Barter Only</p>
                          <p className="text-sm text-gray-600">Open to offers</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-2xl font-bold text-blue-600">₱{product.price?.toLocaleString() || '0'}</p>
                          <p className="text-sm text-gray-500">Qty: {product.quantity || 0}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Add to Cart / Make Offer Button */}
                    {product.status === 'sold' ? (
                      <div 
                        style={{
                          width: '100%',
                          padding: '12px 0',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          textAlign: 'center',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          cursor: 'not-allowed',
                          opacity: 0.8
                        }}
                      >
                        SOLD OUT
                      </div>
                    ) : (
                      <div 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🔘 [BuyerDashboard] Button clicked for product:', product.name);
                          
                          // Visual feedback - flash the button
                          e.target.style.backgroundColor = '#10b981';
                          setTimeout(() => {
                            e.target.style.backgroundColor = product.selling_mode === 'barter'
                              ? '#ea580c' 
                              : '#2563eb';
                          }, 200);
                          
                          if (product.selling_mode === 'barter') {
                            console.log('🛍️ [BuyerDashboard] This is a barter product, calling handleMakeOffer');
                            handleMakeOffer(product);
                          } else {
                            console.log('🛒 [BuyerDashboard] This is a regular product, calling handleAddToCart');
                            handleAddToCart(product);
                          }
                        }}
                      onMouseDown={(e) => {
                        console.log('🖱️ [BuyerDashboard] Button mouse down for product:', product.name);
                      }}
                      onMouseUp={(e) => {
                        console.log('🖱️ [BuyerDashboard] Button mouse up for product:', product.name);
                      }}
                      style={{
                        cursor: 'pointer',
                        pointerEvents: cartLoading ? 'none' : 'auto',
                        zIndex: 999,
                        position: 'relative',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none',
                        width: '100%',
                        padding: '12px 0',
                        backgroundColor: product.selling_mode === 'barter'
                          ? '#ea580c' 
                          : '#2563eb',
                        color: 'white',
                        borderRadius: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        border: 'none',
                        outline: 'none'
                      }}
                      className="transform hover:scale-105 transition-all duration-200"
                    >
                      {product.selling_mode === 'barter' ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>Make Offer</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                          </svg>
                          <span>{cartLoading && addingProductId === product.id ? 'Adding...' : 'Add to Cart'}</span>
                        </>
                      )}
                    </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Why Choose Chifere?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-3xl">
                  🛡️
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Secure Trading</h3>
                <p className="text-gray-600">Safe and secure transactions with buyer protection</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-3xl">
                  🌱
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Eco-Friendly</h3>
                <p className="text-gray-600">Promote sustainability through reusing and bartering</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-3xl">
                  💬
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Community</h3>
                <p className="text-gray-600">Connect with like-minded people in your area</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-delay-1s {
          animation-delay: 1s;
        }
        
        .animate-delay-2s {
          animation-delay: 2s;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* Offer Modal */}
      {selectedProduct && selectedStore && (
        <MessagingProvider>
          <OfferModal
            isOpen={isOfferModalOpen}
            onClose={() => {
              console.log('🚪 [BuyerDashboard] Closing offer modal');
              setIsOfferModalOpen(false);
              setSelectedProduct(null);
              setSelectedStore(null);
            }}
            product={selectedProduct}
            seller={selectedStore}
          />
        </MessagingProvider>
      )}
      
      {/* Debug info removed */}
    </BuyerLayout>
  );
};

export default Buyer_Dashboard;
