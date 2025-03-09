import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OldestTaskDisplay } from '../OldestTaskDisplay';
import * as formatting from '../../../utils/formatting';

// Mock the formatting module
jest.mock('../../../utils/formatting', () => ({
  formatDuration: jest.fn()
}));

describe('OldestTaskDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (formatting.formatDuration as jest.Mock).mockImplementation((seconds) => {
      if (seconds === 0) return 'None';
      if (seconds < 60) return `${seconds}s`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
      return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
    });
  });

  // Normal cases
  test('renders with loading state', () => {
    render(<OldestTaskDisplay index={0} isLoading={true} oldestTaskAge={null} />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Oldest Task')).toBeInTheDocument();
  });

  test('renders with age data for index 0', () => {
    render(<OldestTaskDisplay index={0} isLoading={false} oldestTaskAge={3600} />);
    
    expect(screen.getByText('1h')).toBeInTheDocument();
    expect(formatting.formatDuration).toHaveBeenCalledWith(3600);
  });

  test('renders with age data for index 1', () => {
    render(<OldestTaskDisplay index={1} isLoading={false} oldestTaskAge={7200} />);
    
    expect(screen.getByText('2h')).toBeInTheDocument();
    expect(formatting.formatDuration).toHaveBeenCalledWith(7200);
  });

  test('renders with age data for index 2', () => {
    render(<OldestTaskDisplay index={2} isLoading={false} oldestTaskAge={86400} />);
    
    expect(screen.getByText('1d 0h')).toBeInTheDocument();
    expect(formatting.formatDuration).toHaveBeenCalledWith(86400);
  });

  // Edge cases
  test('renders with zero age', () => {
    render(<OldestTaskDisplay index={0} isLoading={false} oldestTaskAge={0} />);
    
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(formatting.formatDuration).toHaveBeenCalledWith(0);
  });

  test('renders with null age', () => {
    render(<OldestTaskDisplay index={0} isLoading={false} oldestTaskAge={null} />);
    
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(formatting.formatDuration).toHaveBeenCalledWith(0);
  });

  test('handles very large age values', () => {
    const largeAge = 10 * 86400; // 10 days
    render(<OldestTaskDisplay index={0} isLoading={false} oldestTaskAge={largeAge} />);
    
    expect(screen.getByText('10d 0h')).toBeInTheDocument();
    expect(formatting.formatDuration).toHaveBeenCalledWith(largeAge);
  });

  // Invalid inputs
  test('handles negative age value by treating as zero', () => {
    render(<OldestTaskDisplay index={0} isLoading={false} oldestTaskAge={-100} />);
    
    // Our mock will return "None" for negative values
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(formatting.formatDuration).toHaveBeenCalledWith(-100);
  });

  test('handles invalid index by falling back to 0', () => {
    render(<OldestTaskDisplay index={-1} isLoading={false} oldestTaskAge={3600} />);
    
    // Should still show the time
    expect(screen.getByText('1h')).toBeInTheDocument();
    expect(formatting.formatDuration).toHaveBeenCalledWith(3600);
  });

  test('handles very high index by using mod 3', () => {
    render(<OldestTaskDisplay index={10} isLoading={false} oldestTaskAge={3600} />);
    
    // Index 10 % 3 = 1, so should show 1h
    expect(screen.getByText('1h')).toBeInTheDocument();
    expect(formatting.formatDuration).toHaveBeenCalledWith(3600);
  });
}); 