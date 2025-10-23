/**
 * Advanced Search Component
 * 
 * Enhanced search functionality with category-based filtering as specified
 * in the ChiFere manuscript. Provides comprehensive search capabilities
 * for the sustainable marketplace.
 * 
 * Features:
 * - Text-based search with autocomplete
 * - Category-based filtering
 * - Price range filtering
 * - Location-based search
 * - Condition filtering
 * - Sort options
 * - Search history
 * - Saved searches
 * 
 * @version 1.0.0 - Enhanced search per manuscript requirements
 */

import React, { useState, useEffect, useRef } from 'react';
import { theme } from '../../../../styles/designSystem';
import { 
  FiSearch,
  FiFilter,
  FiX,
  FiMapPin,
  FiTag,
  FiDollarSign,
  FiStar,
  FiClock,
  FiBookmark,
  FiTrendingUp,
  FiGrid,
  FiList,
  FiChevronDown,
  FiRefreshCw
} from 'react-icons/fi';

const AdvancedSearch = ({ 
  onSearch, 
  onFiltersChange,
  initialSearchTerm = '',
  categories = [],
  locations = [],
  showSavedSearches = true 
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const searchInputRef = useRef(null);

  const [filters, setFilters] = useState({
    category: 'all',
    priceMin: '',
    priceMax: '',
    location: 'all',
    condition: 'all',
    type: 'all', // 'all', 'sale', 'barter'
    rating: 'all',
    sortBy: 'relevance',
    viewMode: 'grid'
  });

  // Categories from ChiFere manuscript
  const defaultCategories = [
    { id: 'all', name: 'All Categories', count: 0 },
    { id: 'electronics', name: 'Electronics', count: 156 },
    { id: 'fashion', name: 'Fashion & Clothing', count: 234 },
    { id: 'furniture', name: 'Furniture & Home', count: 89 },
    { id: 'books', name: 'Books & Media', count: 167 },
    { id: 'sports', name: 'Sports & Recreation', count: 78 },
    { id: 'automotive', name: 'Automotive', count: 45 },
    { id: 'collectibles', name: 'Collectibles & Art', count: 123 },
    { id: 'appliances', name: 'Home Appliances', count: 67 },
    { id: 'toys', name: 'Toys & Games', count: 98 },
    { id: 'music', name: 'Musical Instruments', count: 34 },
    { id: 'other', name: 'Other', count: 56 }
  ];

  // Locations in Cebu
  const defaultLocations = [
    { id: 'all', name: 'All Locations' },
    { id: 'cebu-city', name: 'Cebu City' },
    { id: 'lapu-lapu', name: 'Lapu-Lapu City' },
    { id: 'mandaue', name: 'Mandaue City' },
    { id: 'talisay', name: 'Talisay City' },
    { id: 'danao', name: 'Danao City' },
    { id: 'toledo', name: 'Toledo City' },
    { id: 'carcar', name: 'Carcar City' }
  ];

  const categoryList = categories.length > 0 ? categories : defaultCategories;
  const locationList = locations.length > 0 ? locations : defaultLocations;

  // Mock search suggestions
  const mockSuggestions = [
    'iPhone 13 Pro',
    'Vintage leather jacket',
    'MacBook Air M2',
    'Antique furniture',
    'Camera lens',
    'Gaming chair',
    'Acoustic guitar',
    'Designer bag',
    'Vintage books',
    'Art supplies'
  ];

  // Load search history from localStorage
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('chifere_search_history') || '[]');
    const saved = JSON.parse(localStorage.getItem('chifere_saved_searches') || '[]');
    setSearchHistory(history.slice(0, 10)); // Keep only last 10
    setSavedSearches(saved);
  }, []);

  // Generate suggestions based on search term
  useEffect(() => {
    if (searchTerm.length > 0) {
      const filteredSuggestions = mockSuggestions
        .filter(suggestion => 
          suggestion.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 8);
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm]);

  const handleSearch = (term = searchTerm) => {
    if (!term.trim()) return;

    // Add to search history
    const newHistory = [term, ...searchHistory.filter(h => h !== term)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('chifere_search_history', JSON.stringify(newHistory));

    // Hide suggestions
    setShowSuggestions(false);

    // Trigger search
    if (onSearch) {
      onSearch(term, filters);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  const saveCurrentSearch = () => {
    if (!searchTerm.trim()) return;

    const searchConfig = {
      id: Date.now(),
      term: searchTerm,
      filters: { ...filters },
      timestamp: new Date().toISOString(),
      name: `"${searchTerm}" search`
    };

    const newSaved = [searchConfig, ...savedSearches].slice(0, 5); // Keep only 5 saved
    setSavedSearches(newSaved);
    localStorage.setItem('chifere_saved_searches', JSON.stringify(newSaved));
  };

  const loadSavedSearch = (savedSearch) => {
    setSearchTerm(savedSearch.term);
    setFilters(savedSearch.filters);
    handleSearch(savedSearch.term);
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: 'all',
      priceMin: '',
      priceMax: '',
      location: 'all',
      condition: 'all',
      type: 'all',
      rating: 'all',
      sortBy: 'relevance',
      viewMode: filters.viewMode // Keep view mode
    };
    setFilters(clearedFilters);
    
    if (onFiltersChange) {
      onFiltersChange(clearedFilters);
    }
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'viewMode' || key === 'sortBy') return false;
    if (key === 'priceMin' || key === 'priceMax') return value !== '';
    return value !== 'all';
  }).length;

  return (
    <div className="w-full">
      {/* Main Search Bar */}
      <div className="relative mb-4">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for items, brands, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full pl-12 pr-16 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            style={{ borderColor: theme.colors.gray[300] }}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FiFilter className="w-5 h-5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => handleSearch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Search
            </button>
          </div>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
          <div 
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border z-50 max-h-96 overflow-y-auto"
            style={{ borderColor: theme.colors.gray[200] }}
          >
            {/* Recent Searches */}
            {searchHistory.length > 0 && searchTerm === '' && (
              <div className="p-4 border-b" style={{ borderColor: theme.colors.gray[100] }}>
                <div className="flex items-center space-x-2 mb-3">
                  <FiClock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Recent Searches</span>
                </div>
                <div className="space-y-1">
                  {searchHistory.slice(0, 5).map((term, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchTerm(term);
                        handleSearch(term);
                      }}
                      className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <FiTrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Suggestions</span>
                </div>
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchTerm(suggestion);
                        handleSearch(suggestion);
                      }}
                      className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div 
          className="mb-6 p-6 bg-gray-50 rounded-xl border"
          style={{ borderColor: theme.colors.gray[200] }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Advanced Filters</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={saveCurrentSearch}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                disabled={!searchTerm.trim()}
              >
                <FiBookmark className="w-4 h-4 mr-1 inline" />
                Save Search
              </button>
              <button
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-700 text-sm"
              >
                <FiRefreshCw className="w-4 h-4 mr-1 inline" />
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: theme.colors.gray[300] }}
              >
                {categoryList.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} {category.count ? `(${category.count})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceMin}
                  onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                  className="w-1/2 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: theme.colors.gray[300] }}
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceMax}
                  onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                  className="w-1/2 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: theme.colors.gray[300] }}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: theme.colors.gray[300] }}
              >
                {locationList.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
              <select
                value={filters.condition}
                onChange={(e) => handleFilterChange('condition', e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: theme.colors.gray[300] }}
              >
                <option value="all">All Conditions</option>
                <option value="new">Brand New</option>
                <option value="like-new">Like New</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>

            {/* Type (Sale/Barter) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: theme.colors.gray[300] }}
              >
                <option value="all">All Types</option>
                <option value="sale">For Sale</option>
                <option value="barter">Barter Only</option>
              </select>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Seller Rating</label>
              <select
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: theme.colors.gray[300] }}
              >
                <option value="all">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="verified">Verified Sellers Only</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: theme.colors.gray[300] }}
              >
                <option value="relevance">Most Relevant</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="distance">Nearest First</option>
                <option value="rating">Best Rated</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
              <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: theme.colors.gray[300] }}>
                <button
                  onClick={() => handleFilterChange('viewMode', 'grid')}
                  className={`flex-1 p-3 flex items-center justify-center transition-colors ${
                    filters.viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <FiGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleFilterChange('viewMode', 'list')}
                  className={`flex-1 p-3 flex items-center justify-center transition-colors ${
                    filters.viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <FiList className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Searches */}
      {showSavedSearches && savedSearches.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Saved Searches</h4>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map(savedSearch => (
              <button
                key={savedSearch.id}
                onClick={() => loadSavedSearch(savedSearch)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors flex items-center space-x-1"
              >
                <span>{savedSearch.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newSaved = savedSearches.filter(s => s.id !== savedSearch.id);
                    setSavedSearches(newSaved);
                    localStorage.setItem('chifere_saved_searches', JSON.stringify(newSaved));
                  }}
                  className="ml-1 hover:text-red-600"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="mb-4">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            {Object.entries(filters).map(([key, value]) => {
              if (key === 'viewMode' || key === 'sortBy' || value === 'all' || value === '') return null;
              
              let displayValue = value;
              if (key === 'category') {
                const cat = categoryList.find(c => c.id === value);
                displayValue = cat ? cat.name : value;
              } else if (key === 'location') {
                const loc = locationList.find(l => l.id === value);
                displayValue = loc ? loc.name : value;
              } else if (key === 'priceMin') {
                displayValue = `Min: ₱${value}`;
              } else if (key === 'priceMax') {
                displayValue = `Max: ₱${value}`;
              }

              return (
                <span
                  key={key}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center space-x-1"
                >
                  <span>{displayValue}</span>
                  <button
                    onClick={() => handleFilterChange(key, key.includes('price') ? '' : 'all')}
                    className="hover:text-red-600"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;