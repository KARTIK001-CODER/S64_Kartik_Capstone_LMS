import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const SearchBar = ({ onSearch, initialValue, className = '' }) => {
  const navigate = useNavigate();
  const { input: urlInput } = useParams();
  const [input, setInput] = useState(initialValue || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (urlInput) setInput(urlInput);
    else if (initialValue !== undefined) setInput(initialValue);
  }, [urlInput, initialValue]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      const term = input.trim();
      if (onSearch) {
        onSearch(term);
      } else {
        navigate('/courses-list/' + encodeURIComponent(term));
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className={`relative ${className}`}>
      <div className="flex items-center">
        <Search size={18} className="absolute left-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search for courses..."
          className="w-full h-11 pl-11 pr-32 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary text-sm"
        />
        <div className="absolute right-1.5">
          <button
            type="submit"
            className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;
