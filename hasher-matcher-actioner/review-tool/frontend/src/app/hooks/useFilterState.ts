/**
 * Hook for managing content filter state
 * 
 * This hook provides a consistent way to manage filter state across components
 * like the dashboard and review pages.
 */

import { useState, useCallback } from 'react';

export interface FilterState {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  
  selectedHashAlgorithm: string;
  setSelectedHashAlgorithm: (algorithm: string) => void;
  
  selectedConfidenceLevel: string;
  setSelectedConfidenceLevel: (level: string) => void;
  
  showEscalated: boolean;
  setShowEscalated: (show: boolean) => void;
  
  resetFilters: () => void;
  updateUrlWithFilters: () => void;
}

export function useFilterState(
  initialCategory: string = '', 
  initialAlgorithm: string = '', 
  initialConfidenceLevel: string = '', 
  initialShowEscalated: boolean = false
): FilterState {
  // State for filters
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedHashAlgorithm, setSelectedHashAlgorithm] = useState<string>(initialAlgorithm);
  const [selectedConfidenceLevel, setSelectedConfidenceLevel] = useState<string>(initialConfidenceLevel);
  const [showEscalated, setShowEscalated] = useState<boolean>(initialShowEscalated);
  
  // Reset filters to initial values
  const resetFilters = useCallback(() => {
    setSelectedCategory('');
    setSelectedHashAlgorithm('');
    setSelectedConfidenceLevel('');
    setShowEscalated(false);
  }, []);
  
  // Update URL with current filters (for bookmarking/sharing)
  const updateUrlWithFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.append('category', selectedCategory);
    if (selectedHashAlgorithm) params.append('algorithm', selectedHashAlgorithm);
    if (selectedConfidenceLevel) params.append('confidence', selectedConfidenceLevel);
    if (showEscalated) params.append('escalated', 'true');
    
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?${params.toString()}`
    );
  }, [selectedCategory, selectedHashAlgorithm, selectedConfidenceLevel, showEscalated]);
  
  return {
    selectedCategory,
    setSelectedCategory,
    selectedHashAlgorithm,
    setSelectedHashAlgorithm,
    selectedConfidenceLevel,
    setSelectedConfidenceLevel,
    showEscalated,
    setShowEscalated,
    resetFilters,
    updateUrlWithFilters
  };
} 