import React, { useState, useEffect } from 'react';
import SellerLayout from '../Seller_Layout/SellerLayout';
import AddProductForm from './AddProductForm';
import EditProductModal from './EditProductModal';
import ConfirmationModal from '../../../../common/ConfirmationModal/ConfirmationModal';
import { theme } from '../../../../../styles/designSystem';
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiEye,
  FiEdit3,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiTrendingUp,
  FiRefreshCw
} from 'react-icons/fi';
import { useAuth } from '../../../../../contexts/AuthContext';
import itemService from '../../../../../services/itemService';

const Products = () => {
  const { user } = useAuth();

  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState(null);
  
  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Categories
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Fashion', label: 'Fashion & Apparel' },
    { value: 'Home & Garden', label: 'Home & Garden' },
    { value: 'Furniture', label: 'Furniture' },
    { value: 'Sports', label: 'Sports & Outdoors' },
    { value: 'Books', label: 'Books & Media' },
    { value: 'Automotive', label: 'Automotive' },
    { value: 'Toys', label: 'Toys & Games' },
    { value: 'Collectibles', label: 'Collectibles & Art' },
    { value: 'Other', label: 'Other' }
  ];

  // Statuses
  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'sold', label: 'Sold' }
  ];

  // Load products on mount
  useEffect(() => {
    if (user?.id) {
      loadProducts();
    }
  }, [user]);

  // Load products from Supabase
  const loadProducts = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all products (active and sold) so seller can see all their products
      const result = await itemService.getItemsBySeller(user.id, 'all');

      if (result.success) {
        setProducts(result.data || []);
      } else {
        setError(result.error || 'Failed to load products');
      }
    } catch (err) {
      console.error('Load products error:', err);
      setError('An error occurred while loading products');
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    sold: products.filter(p => p.status === 'sold').length,
    totalViews: products.reduce((sum, p) => sum + (p.views || 0), 0)
  };

  // Toggle product status (active/sold)
  const toggleProductStatus = async (product) => {
    const newStatus = product.status === 'active' ? 'sold' : 'active';

    try {
      const result = await itemService.updateItem(
        product.id,
        { status: newStatus },
        product.collection
      );

      if (result.success) {
        setProducts(products.map(p =>
          p.id === product.id ? { ...p, status: newStatus } : p
        ));
      } else {
        alert('Failed to update product status: ' + result.error);
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      alert('An error occurred while updating product status');
    }
  };

  // Show delete confirmation modal
  const showDeleteConfirmation = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  // Confirm delete product
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      const result = await itemService.deleteItem(productToDelete.id, productToDelete.collection);

      if (result.success) {
        setProducts(products.filter(p => p.id !== productToDelete.id));
        setShowDeleteModal(false);
        setProductToDelete(null);
      } else {
        alert('Failed to delete product: ' + result.error);
      }
    } catch (err) {
      console.error('Delete product error:', err);
      alert('An error occurred while deleting the product');
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
    setIsDeleting(false);
  };

  // Open edit modal
  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  // Handle add product
  const handleAddProduct = () => {
    setShowAddModal(true);
  };

  // Handle product added/updated
  const handleProductSuccess = () => {
    loadProducts(); // Reload products
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingProduct(null);
  };

  // Product Card Component
  const ProductCard = ({ product }) => (
    <div className="card-base p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start space-x-4">
        {/* Product Image */}
        <div className="relative">
          <img
            src={product.images && product.images[0] ? product.images[0] : '/placeholder-product.svg'}
            alt={product.name}
            className="w-24 h-24 rounded-lg object-cover"
            onError={(e) => {
              e.target.src = '/placeholder-product.svg';
            }}
          />
          <div className="absolute -top-2 -right-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              product.status === 'active' ? 'bg-green-100 text-green-700' :
              product.status === 'sold' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {product.status}
            </span>
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{product.name}</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleProductStatus(product)}
                className={`p-1 rounded transition-colors ${
                  product.status === 'active'
                    ? 'text-green-500 hover:text-green-600'
                    : 'text-blue-500 hover:text-blue-600'
                }`}
                title={product.status === 'active' ? 'Mark as Sold' : 'Mark as Active'}
              >
                {product.status === 'active' ? (
                  <FiToggleRight className="w-5 h-5" />
                ) : (
                  <FiToggleLeft className="w-5 h-5" />
                )}
              </button>
              <div className="relative group">
                <button className="p-1 rounded hover:bg-gray-100">
                  <FiMoreVertical className="w-5 h-5 text-gray-400" />
                </button>
                <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <FiEdit3 className="w-4 h-4 mr-3" />
                      Edit Product
                    </button>
                    <button
                      onClick={() => showDeleteConfirmation(product)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <FiTrash2 className="w-4 h-4 mr-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-3">
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              {product.category}
            </span>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
              {product.condition}
            </span>
            {product.isBarterOnly && (
              <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full">
                Barter
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              {product.isBarterOnly ? (
                <div>
                  <p className="font-bold text-orange-600">Barter Only</p>
                  {product.barterPreferences && (
                    <p className="text-sm text-gray-600">For: {product.barterPreferences}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold" style={{ color: theme.colors.primary[600] }}>
                    ₱{product.price ? product.price.toLocaleString() : '0'}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="text-sm text-gray-500 line-through">
                      ₱{product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500">
                {product.createdAt ? new Date(product.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
              </p>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end space-x-4 text-sm text-gray-600 mb-1">
                <div className="flex items-center">
                  <FiEye className="w-4 h-4 mr-1" />
                  {product.views || 0}
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-4 mr-1">♥</span>
                  {product.likes || 0}
                </div>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <FiTrendingUp className="w-3 h-3 mr-1" />
                {product.collection === 'seller_addItemPreloved' ? 'Preloved' : 'Barter'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <SellerLayout>
      {/* DEBUG BANNER - REMOVE AFTER TESTING */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={loadProducts}
            className="btn-base btn-md btn-outline"
            disabled={loading}
          >
            <FiRefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleAddProduct}
            className="btn-base btn-md btn-primary"
          >
            <FiPlus className="w-5 h-5 mr-2" />
            Add New Product
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-base p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Products</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiTrendingUp className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="card-base p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Active Listings</p>
                <p className="text-2xl font-bold text-gray-800">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiToggleRight className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="card-base p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Sold Items</p>
                <p className="text-2xl font-bold text-gray-800">{stats.sold}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-500">₱</span>
              </div>
            </div>
          </div>

          <div className="card-base p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Views</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalViews}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiEye className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card-base p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-base pl-10 pr-4"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-base min-w-[160px]"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-base min-w-[140px]"
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-base btn-md btn-outline"
              >
                <FiFilter className="w-5 h-5 mr-2" />
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>

          {loading ? (
            <div className="card-base p-12 text-center">
              <FiRefreshCw className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
              <p className="text-gray-600">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="card-base p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FiTrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {products.length === 0 ? 'No products yet' : 'No products found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {products.length === 0
                  ? 'Start selling by adding your first product'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              <button
                onClick={handleAddProduct}
                className="btn-base btn-md btn-primary"
              >
                <FiPlus className="w-5 h-5 mr-2" />
                Add Your First Product
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product, index) => (
                <ProductCard key={`${product.id}-${product.collection || index}`} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="flex items-center justify-between mt-8">
            <p className="text-sm text-gray-600">
              Showing 1 to {filteredProducts.length} of {filteredProducts.length} results
            </p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <AddProductForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleProductSuccess}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingProduct(null);
        }}
        onSuccess={handleProductSuccess}
        productData={editingProduct}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDeleteProduct}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone and will permanently remove the product from your store."
        confirmText="Delete Product"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
        productName={productToDelete?.name}
      />

    </SellerLayout>
  );
};

export default Products;
