import React, { useContext, useState, useEffect, useCallback } from "react";
import "../Search/style.css";
import Button from "@mui/material/Button";
import { IoSearch } from "react-icons/io5";
import { MyContext } from "../../App";
import { useNavigate } from "react-router-dom";
import { postData } from "../../utils/api";
import CircularProgress from '@mui/material/CircularProgress';
import { debounce } from 'lodash';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState(null);

  const context = useContext(MyContext);
  const history = useNavigate();

  // Debounced function to fetch search suggestions
  const fetchSuggestions = useCallback(
    debounce(async (query) => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoadingSuggestions(true);
      setError(null);

      try {
        const response = await postData('/api/product/search/suggestions', {
          query,
          limit: 5
        });

        if (!response) {
          throw new Error('No response from server');
        }

        if (response.error) {
          throw new Error(response.message || 'Failed to fetch suggestions');
        }

        if (response.success && Array.isArray(response.suggestions)) {
          setSuggestions(response.suggestions);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setError(error.message || 'Failed to fetch suggestions. Please try again.');
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300),
    []
  );

  // Handle input change
  const onChangeInput = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setError(null);
    
    if (value.trim().length >= 2) {
      fetchSuggestions(value);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle search submission
  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setShowSuggestions(false);
    setError(null);

    try {
      const response = await postData('/api/product/search/get', {
      page: 1,
      limit: 3,
        query: query
      });

      if (!response) {
        throw new Error('No response from server');
      }

      if (response.error) {
        throw new Error(response.message || 'Search failed');
      }

      if (response.success) {
        context?.setSearchData(response);
        context?.setOpenSearchPanel(false);
        history("/search");
      } else {
        throw new Error('Search failed. Please try again.');
      }
    } catch (error) {
      console.error('Error performing search:', error);
      setError(error.message || 'Search failed. Please try again.');
    } finally {
          setIsLoading(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="search-container relative">
    <div className="searchBox w-[100%] h-[50px] bg-[#e5e5e5] rounded-[5px] relative p-2">
      <input
        type="text"
        placeholder="Search for products..."
        className="w-full h-[35px] focus:outline-none bg-inherit p-2 text-[15px]"
        value={searchQuery}
        onChange={onChangeInput}
          onKeyPress={handleKeyPress}
      />
        <Button 
          className="!absolute top-[8px] right-[5px] z-50 !w-[37px] !min-w-[37px] h-[37px] !rounded-full !text-black" 
          onClick={() => handleSearch()}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={20} /> : <IoSearch className="text-[#4e4e4e] text-[22px]" />}
      </Button>
      </div>

      {/* Search Suggestions */}
      {showSuggestions && (
        <div className="suggestions-container absolute w-full bg-white mt-1 rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto">
          {isLoadingSuggestions ? (
            <div className="p-3 text-center text-gray-500">
              <CircularProgress size={20} />
              <span className="ml-2">Loading suggestions...</span>
            </div>
          ) : error ? (
            <div className="p-3 text-center text-red-500">{error}</div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item p-3 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </div>
            ))
          ) : searchQuery.trim().length >= 2 ? (
            <div className="p-3 text-center text-gray-500">No suggestions found</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Search;
