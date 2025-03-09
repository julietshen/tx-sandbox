import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PendingCountDisplay } from '../PendingCountDisplay';

describe('PendingCountDisplay', () => {
  // Normal cases
  test('renders with loading state', () => {
    render(<PendingCountDisplay index={0} isLoading={true} pendingCount={null} />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Pending Count')).toBeInTheDocument();
  });

  test('renders with count data for index 0', () => {
    render(<PendingCountDisplay index={0} isLoading={false} pendingCount={10} />);
    
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  test('renders with count data for index 1', () => {
    render(<PendingCountDisplay index={1} isLoading={false} pendingCount={20} />);
    
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  test('renders with count data for index 2', () => {
    render(<PendingCountDisplay index={2} isLoading={false} pendingCount={30} />);
    
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  // Edge cases
  test('renders with zero count', () => {
    render(<PendingCountDisplay index={0} isLoading={false} pendingCount={0} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  test('renders with null count', () => {
    render(<PendingCountDisplay index={0} isLoading={false} pendingCount={null} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  test('handles large count values', () => {
    render(<PendingCountDisplay index={0} isLoading={false} pendingCount={1000} />);
    
    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  test('applies correct color based on index', () => {
    const { rerender } = render(<PendingCountDisplay index={0} isLoading={false} pendingCount={10} />);
    
    // Index 0 should use blue scheme
    const statBox0 = screen.getByTestId('pending-count-stat');
    expect(statBox0).toHaveClass('bg-blue-50');
    expect(statBox0.querySelector('div')).toHaveClass('text-blue-500');
    
    // Index 1 should use purple scheme
    rerender(<PendingCountDisplay index={1} isLoading={false} pendingCount={10} />);
    const statBox1 = screen.getByTestId('pending-count-stat');
    expect(statBox1).toHaveClass('bg-purple-50');
    expect(statBox1.querySelector('div')).toHaveClass('text-purple-500');
    
    // Index 2 should use green scheme
    rerender(<PendingCountDisplay index={2} isLoading={false} pendingCount={10} />);
    const statBox2 = screen.getByTestId('pending-count-stat');
    expect(statBox2).toHaveClass('bg-green-50');
    expect(statBox2.querySelector('div')).toHaveClass('text-green-500');
  });

  // Invalid inputs
  test('handles negative count by treating as zero', () => {
    render(<PendingCountDisplay index={0} isLoading={false} pendingCount={-10} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  test('handles invalid index by falling back to 0', () => {
    render(<PendingCountDisplay index={-1} isLoading={false} pendingCount={10} />);
    
    // Should still show the count
    expect(screen.getByText('10')).toBeInTheDocument();
    
    // Should use default (index 0) color scheme
    const statBox = screen.getByTestId('pending-count-stat');
    expect(statBox).toHaveClass('bg-blue-50');
  });

  test('handles very high index by using mod 3', () => {
    render(<PendingCountDisplay index={10} isLoading={false} pendingCount={10} />);
    
    // Index 10 % 3 = 1, so should use purple scheme
    const statBox = screen.getByTestId('pending-count-stat');
    expect(statBox).toHaveClass('bg-purple-50');
  });

  test('renders with undefined count as 0', () => {
    // @ts-ignore - Testing with invalid prop type
    render(<PendingCountDisplay index={0} isLoading={false} pendingCount={undefined} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
  });
}); 