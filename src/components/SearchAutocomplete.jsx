/**
 * Search Autocomplete Component
 * 
 * This component provides an intelligent search experience with real-time suggestions
 * for products, stores, and categories. Inspired by modern e-commerce platforms.
 * 
 * Features:
 * - Real-time search suggestions as you type
 * - Grouped suggestions (Stores, Products, Categories)
 * - Keyboard navigation support
 * - Click selection
 * - Loading states and error handling
 * - Responsive design
 * 
 * Design System Usage:
 * - Colors: Uses theme.colors for consistent styling
 * - Typography: Applies theme.typography for text consistency
 * - Shadows: Uses theme.shadows for dropdown elevation
 * - Border Radius: Applies theme.borderRadius for consistent corners
 * - Animations: Uses theme.animations for smooth interactions
 * 
 * @version 1.0.0 - Initial implementation
 */

import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiLoader } from 'react-icons/fi';
import theme from '../styles/designSystem';
import searchService from '../services/searchService';

const SearchAutocomplete = ({ 
  placeholder = "Search for products, brands, or categories...",
  onSuggestionSelected,
  className = "",
  ...props 
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [highlightedSectionIndex, setHighlightedSectionIndex] = useState(-1);
  
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  // Flatten suggestions for keyboard navigation
  const flatSuggestions = suggestions.reduce((acc, section, sectionIndex) => {
    section.suggestions.forEach((suggestion, suggestionIndex) => {
      acc.push({
        ...suggestion,
        sectionIndex,
        suggestionIndex,
        flatIndex: acc.length
      });
    });
    return acc;
  }, []);

  const fetchSuggestions = useCallback(async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchService.getSuggestions(searchQuery);
      if (results.success) {
        setSuggestions(results.data);
        setIsOpen(results.data.length > 0);
        setHighlightedIndex(-1);
        setHighlightedSectionIndex(-1);
      } else {
        console.error('Error fetching suggestions:', results.error);
        setSuggestions([]);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedFetchSuggestions = useCallback((searchQuery) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300);
  }, [fetchSuggestions]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedFetchSuggestions(value);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.title);
    setIsOpen(false);
    setSuggestions([]);
    
    if (onSuggestionSelected) {
      onSuggestionSelected(suggestion);
    } else {
      // Default navigation behavior
      if (suggestion.type === 'store') {
        navigate(`/buyer/store/${suggestion.id}`);
      } else if (suggestion.type === 'product') {
        navigate(`/item/${suggestion.id}`);
      } else if (suggestion.type === 'category') {
        navigate(`/buyer/search?q=${encodeURIComponent(suggestion.title)}`);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || flatSuggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = highlightedIndex < flatSuggestions.length - 1 ? highlightedIndex + 1 : 0;
        setHighlightedIndex(nextIndex);
        const nextSuggestion = flatSuggestions[nextIndex];
        setHighlightedSectionIndex(nextSuggestion.sectionIndex);
        break;

      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = highlightedIndex > 0 ? highlightedIndex - 1 : flatSuggestions.length - 1;
        setHighlightedIndex(prevIndex);
        const prevSuggestion = flatSuggestions[prevIndex];
        setHighlightedSectionIndex(prevSuggestion.sectionIndex);
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionClick(flatSuggestions[highlightedIndex]);
        } else {
          handleSubmit(e);
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setSuggestions([]);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;

      default:
        break;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/buyer/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow suggestion clicks
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, 200);
  };

  return (
    <div className={`relative ${className}`} {...props}>
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            style={{
              borderColor: isOpen ? theme.colors.primary[500] : theme.colors.gray[300],
              borderRadius: theme.borderRadius.lg
            }}
            autoComplete="off"
          />
          
          {/* Search Icon */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {isLoading ? (
              <FiLoader 
                className="animate-spin"
                style={{ color: theme.colors.primary[500] }}
                size={16}
              />
            ) : (
              <FiSearch 
                style={{ color: theme.colors.gray[400] }}
                size={16}
              />
            )}
          </div>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 max-h-96 overflow-y-auto"
          style={{
            backgroundColor: theme.colors.white,
            borderRadius: theme.borderRadius.lg,
            boxShadow: theme.shadows.xl,
            border: `1px solid ${theme.colors.gray[200]}`,
            zIndex: 9999
          }}
        >
          {suggestions.map((section, sectionIndex) => (
            <div key={section.title}>
              {/* Section Title */}
              <div 
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wide border-b"
                style={{ 
                  color: theme.colors.gray[500],
                  backgroundColor: theme.colors.gray[50],
                  borderColor: theme.colors.gray[200]
                }}
              >
                {section.title}
              </div>
              
              {/* Section Suggestions */}
              {section.suggestions.map((suggestion, suggestionIndex) => {
                const flatIndex = flatSuggestions.findIndex(
                  item => item.sectionIndex === sectionIndex && item.suggestionIndex === suggestionIndex
                );
                const isHighlighted = highlightedIndex === flatIndex;
                
                return (
                  <div
                    key={suggestion.id}
                    className="px-4 py-3 cursor-pointer transition-colors duration-150 flex items-center gap-3"
                    style={{
                      backgroundColor: isHighlighted ? theme.colors.primary[50] : theme.colors.white,
                      borderBottom: `1px solid ${theme.colors.gray[100]}`
                    }}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => {
                      setHighlightedIndex(flatIndex);
                      setHighlightedSectionIndex(sectionIndex);
                    }}
                  >
                    {/* Icon */}
                    <span className="text-lg">{suggestion.icon}</span>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div 
                        className="font-medium truncate"
                        style={{ color: theme.colors.gray[800] }}
                      >
                        {suggestion.title}
                      </div>
                      <div 
                        className="text-sm truncate"
                        style={{ color: theme.colors.gray[500] }}
                      >
                        {suggestion.subtitle}
                      </div>
                    </div>

                    {/* Type Badge */}
                    <div 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: 
                          suggestion.type === 'store' ? theme.colors.primary[100] :
                          suggestion.type === 'product' ? theme.colors.success[100] :
                          theme.colors.secondary[100],
                        color:
                          suggestion.type === 'store' ? theme.colors.primary[700] :
                          suggestion.type === 'product' ? theme.colors.success[700] :
                          theme.colors.secondary[700]
                      }}
                    >
                      {suggestion.type}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          
          {/* Footer */}
          <div 
            className="px-4 py-2 text-center text-xs border-t"
            style={{ 
              color: theme.colors.gray[500],
              backgroundColor: theme.colors.gray[50],
              borderColor: theme.colors.gray[200]
            }}
          >
            Press Enter to search for "{query}"
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
