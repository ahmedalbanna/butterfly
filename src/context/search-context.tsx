'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Product } from '@prisma/client';
import { searchProducts } from '@/app/actions/products';

type SearchContextType = {
  isOpen: boolean;
  query: string;
  results: Product[];
  isLoading: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  setQuery: (query: string) => void;
  performSearch: (query: string) => Promise<void>;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await searchProducts(searchQuery);
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <SearchContext.Provider value={{
      isOpen,
      query,
      results,
      isLoading,
      openSearch,
      closeSearch,
      setQuery,
      performSearch
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) throw new Error('useSearch must be used within a SearchProvider');
  return context;
}
