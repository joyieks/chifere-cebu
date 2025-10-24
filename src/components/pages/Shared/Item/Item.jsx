import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BuyerLayout from '../../Buyer/Buyer_Menu/Buyer_Layout/Buyer_layout';
import { theme } from '../../../../styles/designSystem';
import productService from '../../../../services/productService';
import reviewService from '../../../../services/reviewService';
import { useCart } from '../../../../contexts/CartContext';
import OfferModal from '../OfferModal/OfferModal';
import { MessagingProvider } from '../../../../contexts/MessagingContext';

const Item = () => {
  const { id, itemId } = useParams(); // Support both parameter names
  const navigate = useNavigate();
  const { addToCart, loading: cartLoading } = useCart();
  
  // State management
  const [product, setProduct] = useState(null);
  const [store, setStore] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Product interaction state
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

  // Load product data
  useEffect(() => {
    const loadProductData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the product ID from either parameter name
        const targetItemId = id || itemId;
        
        // If no product ID provided, show error
        if (!targetItemId) {
          setError('No product ID provided');
          setLoading(false);
          return;
        }

        // Load product data
        const productResult = await productService.getProductById(targetItemId);
        
        if (!productResult.success) {
          throw new Error(productResult.error || 'Product not found');
        }
        
        const productData = productResult.data;
        setProduct(productData);
        
        // Debug: Log product data to see barter fields
        console.log('🔄 [Item] Product data loaded:', {
          id: productData.id,
          name: productData.name,
          selling_mode: productData.selling_mode,
          product_type: productData.product_type,
          price: productData.price,
          estimated_value: productData.estimated_value,
          barter_preferences: productData.barter_preferences,
          seller_id: productData.seller_id,
          user_profiles: productData.user_profiles
        });

        // For now, we'll use the seller info from the product data
        // The productService already includes user_profiles data
        if (productData.user_profiles) {
          const storeData = {
            id: productData.user_profiles.id,
            name: productData.user_profiles.business_name || productData.user_profiles.display_name,
            business_name: productData.user_profiles.business_name,
            display_name: productData.user_profiles.display_name,
            rating: 4.5, // Default rating since it's not in the current schema
            location: { city: 'Cebu' }, // Default location
            verified: true, // Default verification status
            policies: {
              shipping: 'Standard shipping',
              returns: '30-day returns',
              payment: 'All major cards accepted'
            }
          };
          console.log('🔄 [Item] Setting store data:', storeData);
          setStore(storeData);
        } else {
          console.error('🔄 [Item] No user_profiles data found in product:', productData);
          
          // Fallback: Create store data from product seller_id if available
          if (productData.seller_id) {
            const fallbackStoreData = {
              id: productData.seller_id,
              name: 'Unknown Store',
              business_name: 'Unknown Store',
              display_name: 'Unknown Store',
              rating: 4.5,
              location: { city: 'Cebu' },
              verified: false,
              policies: {
                shipping: 'Standard shipping',
                returns: '30-day returns',
                payment: 'All major cards accepted'
              }
            };
            console.log('🔄 [Item] Setting fallback store data:', fallbackStoreData);
            setStore(fallbackStoreData);
          } else {
            console.error('🔄 [Item] No seller_id found in product data either');
          }
        }

        // Load reviews for this product
        await loadProductReviews(targetItemId);
        
        // For now, set empty related products
        // TODO: Implement related products service
        setRelatedProducts([]);

      } catch (err) {
        console.error('Error loading product data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProductData();
  }, [id, itemId]);

  // Load reviews for the product
  const loadProductReviews = async (productId) => {
    try {
      console.log('🔍 [Item] Loading reviews for product:', productId);
      const result = await reviewService.getProductReviews(productId, 20, 0);
      
      if (result.success) {
        setReviews(result.reviews || []);
        console.log('✅ [Item] Reviews loaded:', result.reviews?.length || 0);
      } else {
        console.warn('⚠️ [Item] Failed to load reviews:', result.error);
        setReviews([]);
      }
    } catch (error) {
      console.error('❌ [Item] Load reviews error:', error);
      setReviews([]);
    }
  };

  // Loading state
  if (loading) {
    return (
      <BuyerLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: theme.spacing[3],
            color: theme.colors.gray[600]
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: `3px solid ${theme.colors.gray[200]}`,
              borderTop: `3px solid ${theme.colors.primary[500]}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span>Loading product details...</span>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <BuyerLayout>
        <div className="min-h-screen flex flex-col items-center justify-center" style={{ gap: theme.spacing[4] }}>
          <div style={{ color: theme.colors.error[500], fontSize: theme.typography.fontSize['2xl'] }}>
            Product not found
          </div>
          <div style={{ color: theme.colors.gray[600] }}>
            {error || 'The product you are looking for does not exist.'}
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              ...theme.components.button.size.md,
              ...theme.components.button.variant.primary,
              transition: theme.animations.transition.all
            }}
          >
            Back to Home
          </button>
        </div>
      </BuyerLayout>
    );
  }

  // Calculate discount percentage
  const discountPercentage = product.original_price && product.price 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  // Add to cart handler
  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price || 0,
        image: product.primary_image || product.images?.[0] || '',
        sellerId: product.seller_id || '',
        sellerName: product.user_profiles?.business_name || product.user_profiles?.display_name || 'Store',
        category: product.category,
        quantity: quantity
      };
      
      await addToCart(cartItem, quantity);
      console.log('✅ Item added to cart:', product.name);
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
    }
  };

  return (
    <BuyerLayout>
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: theme.colors.background.secondary,
        paddingTop: theme.spacing[8],
        paddingBottom: theme.spacing[12]
      }}>
        {/* Breadcrumb Navigation */}
        <div style={{ 
          maxWidth: theme.layout.container['2xl'], 
          margin: '0 auto', 
          padding: `0 ${theme.spacing[6]}`,
          marginBottom: theme.spacing[6]
        }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[2],
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.gray[600]
          }}>
            <span 
              onClick={() => navigate('/')}
              style={{ 
                cursor: 'pointer',
                color: theme.colors.primary[600],
                textDecoration: 'none'
              }}
            >
              Home
            </span>
            <span>›</span>
            <span 
              onClick={() => navigate(`/search?categories=${product.category}`)}
              style={{ 
                cursor: 'pointer',
                color: theme.colors.primary[600],
                textDecoration: 'none'
              }}
            >
              {product.category}
            </span>
            <span>›</span>
            <span style={{ color: theme.colors.gray[900] }}>{product.name}</span>
          </div>
        </div>

        {/* Main Product Section */}
        <div style={{ 
          maxWidth: theme.layout.container['2xl'], 
          margin: '0 auto', 
          padding: `0 ${theme.spacing[6]}`
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: theme.spacing[12],
            backgroundColor: theme.colors.white,
            borderRadius: theme.borderRadius['2xl'],
            padding: theme.spacing[8],
            boxShadow: theme.shadows.lg,
            marginBottom: theme.spacing[8]
          }}>
            {/* Image Gallery Section */}
            <div style={{ minWidth: '320px' }}>
              {/* Main Product Image */}
              <div style={{
                position: 'relative',
                backgroundColor: theme.colors.gray[50],
                borderRadius: theme.borderRadius.xl,
                padding: theme.spacing[4],
                marginBottom: theme.spacing[4],
                aspectRatio: '1/1',
                overflow: 'hidden',
                cursor: 'zoom-in'
              }}
              onClick={() => setIsImageModalOpen(true)}
              >
                <img 
                  src={product.images?.[selectedImage] || product.primary_image || '/placeholder-product.jpg'} 
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    transition: theme.animations.transition.transform
                  }}
                />
                {/* Discount Badge */}
                {discountPercentage > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: theme.spacing[4],
                    left: theme.spacing[4],
                    backgroundColor: theme.colors.error[500],
                    color: theme.colors.white,
                    padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
                    borderRadius: theme.borderRadius.full,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold
                  }}>
                    -{discountPercentage}%
                  </div>
                )}
                {/* Wishlist Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsWishlisted(!isWishlisted);
                  }}
                  style={{
                    position: 'absolute',
                    top: theme.spacing[4],
                    right: theme.spacing[4],
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: theme.colors.white,
                    border: `1px solid ${theme.colors.gray[300]}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: theme.shadows.sm,
                    transition: theme.animations.transition.all
                  }}
                >
                  <span style={{ 
                    fontSize: '20px',
                    color: isWishlisted ? theme.colors.error[500] : theme.colors.gray[400]
                  }}>
                    {isWishlisted ? '❤️' : '🤍'}
                  </span>
                </button>
              </div>

              {/* Thumbnail Gallery */}
              {product.images && product.images.length > 0 && (
                <div style={{
                  display: 'flex',
                  gap: theme.spacing[3],
                  overflowX: 'auto',
                  paddingBottom: theme.spacing[2]
                }}>
                  {product.images.map((image, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      style={{
                        flexShrink: 0,
                        width: '80px',
                        height: '80px',
                        borderRadius: theme.borderRadius.lg,
                        border: selectedImage === idx 
                          ? `2px solid ${theme.colors.primary[500]}` 
                          : `1px solid ${theme.colors.gray[300]}`,
                        backgroundColor: theme.colors.gray[50],
                        padding: theme.spacing[2],
                        cursor: 'pointer',
                        transition: theme.animations.transition.all,
                        overflow: 'hidden'
                      }}
                    >
                      <img 
                        src={image || '/placeholder-product.jpg'} 
                        alt={`${product.name} ${idx + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details Section */}
            <div style={{ minWidth: '320px' }}>
              {/* Product Title & Brand */}
              <div style={{ marginBottom: theme.spacing[6] }}>
                {product.brand && (
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.primary[600],
                    fontWeight: theme.typography.fontWeight.medium,
                    marginBottom: theme.spacing[2]
                  }}>
                    {product.brand}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3], marginBottom: theme.spacing[3] }}>
                  <h1 style={{
                    fontSize: theme.typography.fontSize['3xl'],
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.gray[900],
                    lineHeight: theme.typography.lineHeight.tight,
                    margin: 0
                  }}>
                    {product.name}
                  </h1>
                  
                  {/* Barter Badge */}
                  {(product.selling_mode === 'barter' || product.product_type === 'barter') && (
                    <div style={{
                      backgroundColor: theme.colors.secondary[100],
                      color: theme.colors.secondary[700],
                      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
                      borderRadius: theme.borderRadius.full,
                      fontSize: theme.typography.fontSize.xs,
                      fontWeight: theme.typography.fontWeight.semibold,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      🔄 Barter
                    </div>
                  )}
                </div>
                
                {/* Rating & Reviews */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing[4],
                  marginBottom: theme.spacing[4]
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1] }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{ 
                          color: i < Math.floor(product.rating || 0) 
                            ? theme.colors.secondary[400] 
                            : theme.colors.gray[300],
                          fontSize: theme.typography.fontSize.sm
                        }}>
                          ⭐
                        </span>
                      ))}
                    </div>
                    <span style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.gray[600],
                      fontWeight: theme.typography.fontWeight.medium
                    }}>
                      {product.rating || 0}
                    </span>
                  </div>
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.gray[500]
                  }}>
                    ({reviews.length} reviews)
                  </span>
                </div>
              </div>

              {/* Price Section */}
              <div style={{ 
                marginBottom: theme.spacing[6],
                padding: theme.spacing[4],
                backgroundColor: theme.colors.gray[50],
                borderRadius: theme.borderRadius.xl
              }}>
                {/* Price Label */}
                <div style={{ marginBottom: theme.spacing[2] }}>
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.gray[600],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {(product.selling_mode === 'barter' || product.product_type === 'barter') ? 'Estimated Value' : 'Price'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'baseline', gap: theme.spacing[3] }}>
                  <span style={{
                    fontSize: theme.typography.fontSize['3xl'],
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.gray[900]
                  }}>
                    ₱{(product.selling_mode === 'barter' || product.product_type === 'barter') 
                      ? (product.estimated_value?.toLocaleString() || product.price?.toLocaleString() || '0')
                      : (product.price?.toLocaleString() || '0')
                    }
                  </span>
                  {product.original_price && product.original_price > product.price && (
                    <span style={{
                      fontSize: theme.typography.fontSize.lg,
                      color: theme.colors.gray[500],
                      textDecoration: 'line-through'
                    }}>
                      ₱{product.original_price.toLocaleString()}
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.gray[600],
                  marginTop: theme.spacing[1]
                }}>
                  {product.selling_mode === 'sell' ? 'For Sale' : 'Barter Only'} • Qty: {product.quantity || 1}
                </div>
              </div>

              {/* Stock Status */}
              <div style={{ marginBottom: theme.spacing[6] }}>
                {product.quantity > 0 ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing[2],
                    color: product.quantity <= 5 
                      ? theme.colors.warning[600] 
                      : theme.colors.success[600],
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium
                  }}>
                    <span>●</span>
                    {product.quantity <= 5 
                      ? `Only ${product.quantity} left in stock!` 
                      : `${product.quantity} in stock`}
                  </div>
                ) : (
                  <div style={{
                    color: theme.colors.error[600],
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing[2]
                  }}>
                    <span>●</span>
                    Out of stock
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div style={{ 
                marginBottom: theme.spacing[6],
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing[4]
              }}>
                <span style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.gray[700],
                  minWidth: '60px'
                }}>
                  Quantity:
                </span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: `1px solid ${theme.colors.gray[300]}`,
                  borderRadius: theme.borderRadius.lg,
                  overflow: 'hidden'
                }}>
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    style={{
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.colors.gray[50],
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: theme.typography.fontSize.lg,
                      color: theme.colors.gray[600]
                    }}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      width: '60px',
                      height: '40px',
                      textAlign: 'center',
                      border: 'none',
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.medium
                    }}
                    min="1"
                    max={product.quantity}
                  />
                  <button
                    onClick={() => setQuantity(q => Math.min(product.quantity, q + 1))}
                    style={{
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.colors.gray[50],
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: theme.typography.fontSize.lg,
                      color: theme.colors.gray[600]
                    }}
                    disabled={quantity >= product.quantity}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing[3],
                marginBottom: theme.spacing[8]
              }}>
                {/* Check if item is barter item */}
                {product.selling_mode === 'barter' || product.product_type === 'barter' ? (
                  // Barter item buttons
                  <>
                    <button
                      onClick={handleAddToCart}
                      disabled={product.quantity <= 0 || cartLoading}
                      style={{
                        ...theme.components.button.size.lg,
                        backgroundColor: product.quantity > 0 
                          ? theme.colors.secondary[500] 
                          : theme.colors.gray[300],
                        color: theme.colors.white,
                        border: 'none',
                        borderRadius: theme.borderRadius.xl,
                        fontWeight: theme.typography.fontWeight.semibold,
                        cursor: product.quantity > 0 ? 'pointer' : 'not-allowed',
                        transition: theme.animations.transition.all,
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        if (product.quantity > 0) {
                          e.target.style.backgroundColor = theme.colors.secondary[600];
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = product.quantity > 0 
                          ? theme.colors.secondary[500] 
                          : theme.colors.gray[300];
                      }}
                    >
                      {cartLoading ? 'Adding...' : (product.quantity > 0 ? 'Add to Cart' : 'Out of Stock')}
                    </button>
                    
                    <button
                      onClick={() => {
                        console.log('🔄 [Item] Opening offer modal with data:', {
                          product: product,
                          store: store,
                          productSellerId: product?.seller_id
                        });
                        setIsOfferModalOpen(true);
                      }}
                      style={{
                        ...theme.components.button.size.lg,
                        backgroundColor: 'transparent',
                        color: theme.colors.secondary[600],
                        border: `2px solid ${theme.colors.secondary[500]}`,
                        borderRadius: theme.borderRadius.xl,
                        fontWeight: theme.typography.fontWeight.semibold,
                        cursor: 'pointer',
                        transition: theme.animations.transition.all,
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme.colors.secondary[50];
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      Make Offer
                    </button>
                    
                  </>
                ) : (
                  // Regular product buttons
                  <>
                    <button
                      onClick={handleAddToCart}
                      disabled={product.quantity <= 0 || cartLoading}
                      style={{
                        ...theme.components.button.size.lg,
                        backgroundColor: product.quantity > 0 
                          ? theme.colors.primary[500] 
                          : theme.colors.gray[300],
                        color: theme.colors.white,
                        border: 'none',
                        borderRadius: theme.borderRadius.xl,
                        fontWeight: theme.typography.fontWeight.semibold,
                        cursor: product.quantity > 0 ? 'pointer' : 'not-allowed',
                        transition: theme.animations.transition.all,
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        if (product.quantity > 0) {
                          e.target.style.backgroundColor = theme.colors.primary[600];
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = product.quantity > 0 
                          ? theme.colors.primary[500] 
                          : theme.colors.gray[300];
                      }}
                    >
                      {cartLoading ? 'Adding...' : (product.quantity > 0 ? 'Add to Cart' : 'Out of Stock')}
                    </button>
                    
                    <button
                      onClick={() => {
                        // TODO: Implement buy now functionality
                        console.log('Buy now for product:', product.id);
                        // Could navigate to checkout or add to cart and checkout
                      }}
                      style={{
                        ...theme.components.button.size.lg,
                        backgroundColor: 'transparent',
                        color: theme.colors.primary[600],
                        border: `2px solid ${theme.colors.primary[500]}`,
                        borderRadius: theme.borderRadius.xl,
                        fontWeight: theme.typography.fontWeight.semibold,
                        cursor: 'pointer',
                        transition: theme.animations.transition.all,
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme.colors.primary[50];
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      Buy Now
                    </button>
                    
                  </>
                )}
              </div>

              {/* Store Information */}
              {store && (
                <div style={{
                  padding: theme.spacing[4],
                  backgroundColor: theme.colors.gray[50],
                  borderRadius: theme.borderRadius.xl,
                  marginBottom: theme.spacing[6]
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing[3],
                    marginBottom: theme.spacing[3]
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: theme.colors.primary[100],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: theme.typography.fontSize.lg
                    }}>
                      🏪
                    </div>
                    <div>
                      <div style={{
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.gray[900],
                        marginBottom: '2px'
                      }}>
                        {store.name}
                      </div>
                      <div style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.gray[600],
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing[2]
                      }}>
                        <span>⭐ {store.rating}</span>
                        <span>•</span>
                        <span>{store.location.city}</span>
                        {store.verified && (
                          <>
                            <span>•</span>
                            <span style={{ color: theme.colors.success[600] }}>✅ Verified</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/buyer/store/${store.id}`)}
                    style={{
                      width: '100%',
                      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
                      backgroundColor: 'transparent',
                      border: `1px solid ${theme.colors.gray[300]}`,
                      borderRadius: theme.borderRadius.lg,
                      color: theme.colors.gray[700],
                      fontSize: theme.typography.fontSize.sm,
                      cursor: 'pointer',
                      transition: theme.animations.transition.all
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = theme.colors.gray[100];
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    Visit Store
                  </button>
                </div>
              )}

              {/* Shipping Information */}
              <div style={{
                border: `1px solid ${theme.colors.gray[200]}`,
                borderRadius: theme.borderRadius.xl,
                padding: theme.spacing[4]
              }}>
                <h3 style={{
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.gray[900],
                  marginBottom: theme.spacing[3]
                }}>
                  Shipping & Returns
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                    <span style={{ color: theme.colors.success[600] }}>🚚</span>
                    <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[600] }}>
                      Standard shipping • Delivery in 3-5 days
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                    <span style={{ color: theme.colors.primary[600] }}>↩️</span>
                    <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[600] }}>
                      Free returns within 30 days
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                    <span style={{ color: theme.colors.secondary[600] }}>🛡️</span>
                    <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.gray[600] }}>
                      {product.condition} condition
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabbed Content Section */}
          <div style={{
            backgroundColor: theme.colors.white,
            borderRadius: theme.borderRadius['2xl'],
            padding: theme.spacing[8],
            boxShadow: theme.shadows.lg,
            marginBottom: theme.spacing[8]
          }}>
            {/* Tab Navigation */}
            <div style={{
              borderBottom: `1px solid ${theme.colors.gray[200]}`,
              marginBottom: theme.spacing[6]
            }}>
              <div style={{ display: 'flex', gap: theme.spacing[8] }}>
                {['overview', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: `${theme.spacing[3]} ${theme.spacing[1]}`,
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: activeTab === tab 
                        ? theme.typography.fontWeight.semibold 
                        : theme.typography.fontWeight.medium,
                      color: activeTab === tab 
                        ? theme.colors.primary[600] 
                        : theme.colors.gray[600],
                      borderBottom: activeTab === tab 
                        ? `2px solid ${theme.colors.primary[500]}` 
                        : '2px solid transparent',
                      borderTop: 'none',
                      borderLeft: 'none',
                      borderRight: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      transition: theme.animations.transition.all,
                      textTransform: 'capitalize'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[6] }}>
                  <div>
                    <h3 style={{
                      fontSize: theme.typography.fontSize.xl,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.gray[900],
                      marginBottom: theme.spacing[3]
                    }}>
                      Product Description
                    </h3>
                    <p style={{
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.gray[700],
                      lineHeight: theme.typography.lineHeight.relaxed,
                      marginBottom: theme.spacing[4]
                    }}>
                      {product.description}
                    </p>
                  </div>

                  {/* Key Features */}
                  {product.features && product.features.length > 0 && (
                    <div>
                      <h3 style={{
                        fontSize: theme.typography.fontSize.xl,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.gray[900],
                        marginBottom: theme.spacing[3]
                      }}>
                        Key Features
                      </h3>
                      <ul style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: theme.spacing[3]
                      }}>
                        {product.features.map((feature, index) => (
                          <li key={index} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: theme.spacing[2],
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.gray[700]
                          }}>
                            <span style={{ 
                              color: theme.colors.success[500],
                              marginTop: '2px',
                              flexShrink: 0
                            }}>
                              ✓
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* What's Included */}
                  {product.included && product.included.length > 0 && (
                    <div>
                      <h3 style={{
                        fontSize: theme.typography.fontSize.xl,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.gray[900],
                        marginBottom: theme.spacing[3]
                      }}>
                        What's in the Box
                      </h3>
                      <ul style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: theme.spacing[2]
                      }}>
                        {product.included.map((item, index) => (
                          <li key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: theme.spacing[2],
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.gray[700]
                          }}>
                            <span style={{ 
                              color: theme.colors.primary[500],
                              fontSize: '16px'
                            }}>
                              📦
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}


              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: theme.spacing[6]
                  }}>
                    <h3 style={{
                      fontSize: theme.typography.fontSize.xl,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.gray[900]
                    }}>
                      Customer Reviews
                    </h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing[3],
                      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
                      backgroundColor: theme.colors.gray[50],
                      borderRadius: theme.borderRadius.lg
                    }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <span key={i} style={{ 
                            color: i < Math.floor(product.rating || 0) 
                              ? theme.colors.secondary[400] 
                              : theme.colors.gray[300],
                            fontSize: theme.typography.fontSize.base
                          }}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span style={{
                        fontSize: theme.typography.fontSize.lg,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.gray[900]
                      }}>
                        {product.rating || 0}
                      </span>
                      <span style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.gray[600]
                      }}>
                        ({reviews.length} reviews)
                      </span>
                    </div>
                  </div>

                  {/* Reviews List */}
                  {reviews.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[6] }}>
                      {reviews.slice(0, 3).map((review) => {
                        console.log('🔍 [Item] Rendering review:', {
                          id: review.id,
                          rating: review.rating,
                          comment: review.comment,
                          created_at: review.created_at,
                          fullReview: review
                        });
                        return (
                        <div key={review.id} style={{
                          padding: theme.spacing[4],
                          border: `1px solid ${theme.colors.gray[200]}`,
                          borderRadius: theme.borderRadius.lg
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: theme.spacing[3],
                            marginBottom: theme.spacing[3]
                          }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: theme.colors.primary[100],
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: theme.typography.fontSize.lg
                            }}>
                              👤
                            </div>
                            <div>
                              <div style={{
                                fontSize: theme.typography.fontSize.sm,
                                fontWeight: theme.typography.fontWeight.semibold,
                                color: theme.colors.gray[900],
                                marginBottom: '2px'
                              }}>
                                {review.userName}
                                {review.verified && (
                                  <span style={{
                                    marginLeft: theme.spacing[2],
                                    color: theme.colors.success[600],
                                    fontSize: theme.typography.fontSize.xs
                                  }}>
                                    ✅ Verified Purchase
                                  </span>
                                )}
                              </div>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: theme.spacing[2]
                              }}>
                                <div style={{ display: 'flex', gap: '1px' }}>
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i} style={{ 
                                      color: i < review.rating 
                                        ? theme.colors.secondary[400] 
                                        : theme.colors.gray[300],
                                      fontSize: theme.typography.fontSize.sm
                                    }}>
                                      ⭐
                                    </span>
                                  ))}
                                </div>
                                <span style={{
                                  fontSize: theme.typography.fontSize.xs,
                                  color: theme.colors.gray[500]
                                }}>
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          {review.title && (
                            <h4 style={{
                              fontSize: theme.typography.fontSize.base,
                              fontWeight: theme.typography.fontWeight.semibold,
                              color: theme.colors.gray[900],
                              marginBottom: theme.spacing[2]
                            }}>
                              {review.title}
                            </h4>
                          )}
                          <p style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.gray[700],
                            lineHeight: theme.typography.lineHeight.relaxed,
                            marginBottom: theme.spacing[3]
                          }}>
                            {review.comment}
                          </p>
                          {(review.pros?.length > 0 || review.cons?.length > 0) && (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: theme.spacing[4],
                              marginBottom: theme.spacing[3]
                            }}>
                              {review.pros?.length > 0 && (
                                <div>
                                  <h5 style={{
                                    fontSize: theme.typography.fontSize.sm,
                                    fontWeight: theme.typography.fontWeight.semibold,
                                    color: theme.colors.success[600],
                                    marginBottom: theme.spacing[2]
                                  }}>
                                    👍 Pros
                                  </h5>
                                  <ul style={{ paddingLeft: theme.spacing[4] }}>
                                    {review.pros.map((pro, index) => (
                                      <li key={index} style={{
                                        fontSize: theme.typography.fontSize.xs,
                                        color: theme.colors.gray[600],
                                        marginBottom: theme.spacing[1]
                                      }}>
                                        {pro}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {review.cons?.length > 0 && (
                                <div>
                                  <h5 style={{
                                    fontSize: theme.typography.fontSize.sm,
                                    fontWeight: theme.typography.fontWeight.semibold,
                                    color: theme.colors.warning[600],
                                    marginBottom: theme.spacing[2]
                                  }}>
                                    👎 Cons
                                  </h5>
                                  <ul style={{ paddingLeft: theme.spacing[4] }}>
                                    {review.cons.map((con, index) => (
                                      <li key={index} style={{
                                        fontSize: theme.typography.fontSize.xs,
                                        color: theme.colors.gray[600],
                                        marginBottom: theme.spacing[1]
                                      }}>
                                        {con}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: theme.spacing[4],
                            fontSize: theme.typography.fontSize.xs,
                            color: theme.colors.gray[500]
                          }}>
                            <span>👍 {review.helpful} found this helpful</span>
                          </div>
                        </div>
                        );
                      })}
                      {reviews.length > 3 && (
                        <button
                          style={{
                            ...theme.components.button.size.md,
                            backgroundColor: 'transparent',
                            color: theme.colors.primary[600],
                            border: `1px solid ${theme.colors.primary[500]}`,
                            borderRadius: theme.borderRadius.lg,
                            fontWeight: theme.typography.fontWeight.medium,
                            cursor: 'pointer',
                            transition: theme.animations.transition.all
                          }}
                        >
                          View All Reviews ({reviews.length})
                        </button>
                      )}
                    </div>
                  ) : (
                    <p style={{
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.gray[500],
                      fontStyle: 'italic',
                      textAlign: 'center',
                      padding: theme.spacing[8]
                    }}>
                      No reviews yet. Be the first to review this product!
                    </p>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div style={{
              backgroundColor: theme.colors.white,
              borderRadius: theme.borderRadius['2xl'],
              padding: theme.spacing[8],
              boxShadow: theme.shadows.lg
            }}>
              <h3 style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.gray[900],
                marginBottom: theme.spacing[6],
                textAlign: 'center'
              }}>
                You Might Also Like
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: theme.spacing[6]
              }}>
                {relatedProducts.map((relatedProduct) => (
                  <div
                    key={relatedProduct.id}
                    onClick={() => navigate(`/item/${relatedProduct.id}`)}
                    style={{
                      border: `1px solid ${theme.colors.gray[200]}`,
                      borderRadius: theme.borderRadius.xl,
                      padding: theme.spacing[4],
                      cursor: 'pointer',
                      transition: theme.animations.transition.all,
                      backgroundColor: theme.colors.white
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.boxShadow = theme.shadows.lg;
                      e.target.style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.boxShadow = 'none';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      aspectRatio: '1/1',
                      backgroundColor: theme.colors.gray[50],
                      borderRadius: theme.borderRadius.lg,
                      marginBottom: theme.spacing[3],
                      overflow: 'hidden'
                    }}>
                      <img
                        src={relatedProduct.images[0]?.url || '/placeholder-product.jpg'}
                        alt={relatedProduct.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                    <h4 style={{
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.gray[900],
                      marginBottom: theme.spacing[1],
                      lineHeight: theme.typography.lineHeight.tight
                    }}>
                      {relatedProduct.name}
                    </h4>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing[2],
                      marginBottom: theme.spacing[2]
                    }}>
                      <div style={{ display: 'flex', gap: '1px' }}>
                        {[...Array(5)].map((_, i) => (
                          <span key={i} style={{ 
                            color: i < Math.floor(relatedProduct.rating.average) 
                              ? theme.colors.secondary[400] 
                              : theme.colors.gray[300],
                            fontSize: theme.typography.fontSize.xs
                          }}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span style={{
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.gray[500]
                      }}>
                        ({relatedProduct.rating.count})
                      </span>
                    </div>
                    <div style={{
                      fontSize: theme.typography.fontSize.lg,
                      fontWeight: theme.typography.fontWeight.bold,
                      color: theme.colors.gray[900]
                    }}>
                      ₱{relatedProduct.price.current.toLocaleString()}
                    </div>
                    {relatedProduct.price.original > relatedProduct.price.current && (
                      <div style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.gray[500],
                        textDecoration: 'line-through'
                      }}>
                        ₱{relatedProduct.price.original.toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Offer Modal */}
      <MessagingProvider>
        <OfferModal
          isOpen={isOfferModalOpen}
          onClose={() => setIsOfferModalOpen(false)}
          product={product}
          store={store || (product ? {
            id: product.seller_id || 'unknown',
            name: 'Unknown Store',
            business_name: 'Unknown Store',
            display_name: 'Unknown Store',
            rating: 4.5,
            location: { city: 'Cebu' },
            verified: false,
            policies: {
              shipping: 'Standard shipping',
              returns: '30-day returns',
              payment: 'All major cards accepted'
            }
          } : null)}
        />
      </MessagingProvider>
    </BuyerLayout>
  );
};

export default Item;
