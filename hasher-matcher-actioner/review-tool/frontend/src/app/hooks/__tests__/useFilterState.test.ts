import { renderHook, act } from '@testing-library/react-hooks';
import { useFilterState } from '../useFilterState';

describe('useFilterState', () => {
  // Normal cases
  test('initializes with default values', () => {
    const { result } = renderHook(() => useFilterState());
    
    expect(result.current.filters).toEqual({
      algorithms: [],
      contentCategories: [],
      startDate: null,
      endDate: null
    });
  });

  test('adds algorithm filter', () => {
    const { result } = renderHook(() => useFilterState());
    
    act(() => {
      result.current.updateAlgorithms(['pdq']);
    });
    
    expect(result.current.filters.algorithms).toEqual(['pdq']);
  });

  test('adds multiple algorithm filters', () => {
    const { result } = renderHook(() => useFilterState());
    
    act(() => {
      result.current.updateAlgorithms(['pdq', 'md5']);
    });
    
    expect(result.current.filters.algorithms).toEqual(['pdq', 'md5']);
  });

  test('adds content category filter', () => {
    const { result } = renderHook(() => useFilterState());
    
    act(() => {
      result.current.updateContentCategories(['adult']);
    });
    
    expect(result.current.filters.contentCategories).toEqual(['adult']);
  });

  test('adds multiple content category filters', () => {
    const { result } = renderHook(() => useFilterState());
    
    act(() => {
      result.current.updateContentCategories(['adult', 'hate_speech']);
    });
    
    expect(result.current.filters.contentCategories).toEqual(['adult', 'hate_speech']);
  });

  test('updates start date', () => {
    const { result } = renderHook(() => useFilterState());
    const testDate = new Date('2023-01-01');
    
    act(() => {
      result.current.updateStartDate(testDate);
    });
    
    expect(result.current.filters.startDate).toEqual(testDate);
  });

  test('updates end date', () => {
    const { result } = renderHook(() => useFilterState());
    const testDate = new Date('2023-01-31');
    
    act(() => {
      result.current.updateEndDate(testDate);
    });
    
    expect(result.current.filters.endDate).toEqual(testDate);
  });

  test('resets filters to default values', () => {
    const { result } = renderHook(() => useFilterState());
    
    // Set some filters first
    act(() => {
      result.current.updateAlgorithms(['pdq']);
      result.current.updateContentCategories(['adult']);
      result.current.updateStartDate(new Date('2023-01-01'));
      result.current.updateEndDate(new Date('2023-01-31'));
    });
    
    // Then reset
    act(() => {
      result.current.resetFilters();
    });
    
    // Check all filters are reset
    expect(result.current.filters).toEqual({
      algorithms: [],
      contentCategories: [],
      startDate: null,
      endDate: null
    });
  });

  // Edge cases
  test('handles empty arrays for algorithms', () => {
    const { result } = renderHook(() => useFilterState());
    
    act(() => {
      result.current.updateAlgorithms([]);
    });
    
    expect(result.current.filters.algorithms).toEqual([]);
  });

  test('handles empty arrays for content categories', () => {
    const { result } = renderHook(() => useFilterState());
    
    act(() => {
      result.current.updateContentCategories([]);
    });
    
    expect(result.current.filters.contentCategories).toEqual([]);
  });

  test('handles null for date filters', () => {
    const { result } = renderHook(() => useFilterState());
    
    act(() => {
      result.current.updateStartDate(null);
      result.current.updateEndDate(null);
    });
    
    expect(result.current.filters.startDate).toBeNull();
    expect(result.current.filters.endDate).toBeNull();
  });

  test('properly updates filters when called multiple times', () => {
    const { result } = renderHook(() => useFilterState());
    
    act(() => {
      result.current.updateAlgorithms(['pdq']);
    });
    
    act(() => {
      result.current.updateAlgorithms(['md5']);
    });
    
    expect(result.current.filters.algorithms).toEqual(['md5']);
  });

  // Invalid inputs - these shouldn't occur with proper typing, but testing for robustness
  test('handles invalid algorithm values', () => {
    const { result } = renderHook(() => useFilterState());
    
    act(() => {
      // @ts-ignore - Testing with invalid data
      result.current.updateAlgorithms('not-an-array');
    });
    
    // Since TypeScript would prevent this, we're just checking it doesn't crash
    expect(result.current.filters).toBeDefined();
  });

  test('handles invalid content category values', () => {
    const { result } = renderHook(() => useFilterState());
    
    act(() => {
      // @ts-ignore - Testing with invalid data
      result.current.updateContentCategories('not-an-array');
    });
    
    // Since TypeScript would prevent this, we're just checking it doesn't crash
    expect(result.current.filters).toBeDefined();
  });

  test('handles invalid date values', () => {
    const { result } = renderHook(() => useFilterState());
    
    act(() => {
      // @ts-ignore - Testing with invalid data
      result.current.updateStartDate('not-a-date');
    });
    
    // Since TypeScript would prevent this, we're just checking it doesn't crash
    expect(result.current.filters).toBeDefined();
  });
}); 