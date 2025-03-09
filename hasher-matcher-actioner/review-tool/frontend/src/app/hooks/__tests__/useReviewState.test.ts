import { renderHook, act } from '@testing-library/react-hooks';
import { useReviewState } from '../useReviewState';
import * as apiService from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  getNextTask: jest.fn(),
  approveTask: jest.fn(),
  rejectTask: jest.fn()
}));

describe('useReviewState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Normal cases
  test('initializes with loading state', () => {
    const { result } = renderHook(() => useReviewState());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.task).toBeNull();
    expect(result.current.error).toBeNull();
  });

  test('loads task successfully', async () => {
    const mockTask = {
      id: '123',
      created_at: '2023-01-01T00:00:00Z',
      hash_value: 'abc123',
      source_id: 'source1',
      algorithm: 'pdq',
      content_category: 'adult',
      image_urls: ['https://example.com/image.jpg']
    };
    
    (apiService.getNextTask as jest.Mock).mockResolvedValue(mockTask);
    
    const { result, waitForNextUpdate } = renderHook(() => useReviewState());
    
    // Initial state
    expect(result.current.isLoading).toBe(true);
    
    // Trigger task loading
    act(() => {
      result.current.loadTask();
    });
    
    await waitForNextUpdate();
    
    // Final state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.task).toEqual(mockTask);
    expect(result.current.error).toBeNull();
    expect(apiService.getNextTask).toHaveBeenCalledTimes(1);
  });

  test('handles task approval', async () => {
    const mockTask = {
      id: '123',
      created_at: '2023-01-01T00:00:00Z',
      hash_value: 'abc123',
      source_id: 'source1',
      algorithm: 'pdq',
      content_category: 'adult',
      image_urls: ['https://example.com/image.jpg']
    };
    
    (apiService.getNextTask as jest.Mock).mockResolvedValue(mockTask);
    (apiService.approveTask as jest.Mock).mockResolvedValue({ success: true });
    
    const { result, waitForNextUpdate } = renderHook(() => useReviewState());
    
    // Load task first
    act(() => {
      result.current.loadTask();
    });
    
    await waitForNextUpdate();
    
    // Now approve task
    act(() => {
      result.current.approveTask();
    });
    
    // Should be loading again
    expect(result.current.isLoading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(apiService.approveTask).toHaveBeenCalledWith(mockTask.id);
    expect(apiService.getNextTask).toHaveBeenCalledTimes(2);
  });

  test('handles task rejection', async () => {
    const mockTask = {
      id: '123',
      created_at: '2023-01-01T00:00:00Z',
      hash_value: 'abc123',
      source_id: 'source1',
      algorithm: 'pdq',
      content_category: 'adult',
      image_urls: ['https://example.com/image.jpg']
    };
    
    (apiService.getNextTask as jest.Mock).mockResolvedValue(mockTask);
    (apiService.rejectTask as jest.Mock).mockResolvedValue({ success: true });
    
    const { result, waitForNextUpdate } = renderHook(() => useReviewState());
    
    // Load task first
    act(() => {
      result.current.loadTask();
    });
    
    await waitForNextUpdate();
    
    // Now reject task
    act(() => {
      result.current.rejectTask();
    });
    
    // Should be loading again
    expect(result.current.isLoading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(apiService.rejectTask).toHaveBeenCalledWith(mockTask.id);
    expect(apiService.getNextTask).toHaveBeenCalledTimes(2);
  });

  // Edge cases
  test('handles error when loading task', async () => {
    const errorMessage = 'Failed to load task';
    (apiService.getNextTask as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    const { result, waitForNextUpdate } = renderHook(() => useReviewState());
    
    act(() => {
      result.current.loadTask();
    });
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.task).toBeNull();
    expect(result.current.error).toEqual(errorMessage);
  });

  test('handles no more tasks scenario', async () => {
    (apiService.getNextTask as jest.Mock).mockResolvedValue(null);
    
    const { result, waitForNextUpdate } = renderHook(() => useReviewState());
    
    act(() => {
      result.current.loadTask();
    });
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.task).toBeNull();
    expect(result.current.error).toEqual('No more tasks to review');
  });

  test('handles error when approving task', async () => {
    const mockTask = {
      id: '123',
      created_at: '2023-01-01T00:00:00Z',
      hash_value: 'abc123',
      source_id: 'source1',
      algorithm: 'pdq',
      content_category: 'adult',
      image_urls: ['https://example.com/image.jpg']
    };
    
    const errorMessage = 'Failed to approve task';
    (apiService.getNextTask as jest.Mock).mockResolvedValue(mockTask);
    (apiService.approveTask as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    const { result, waitForNextUpdate } = renderHook(() => useReviewState());
    
    // Load task first
    act(() => {
      result.current.loadTask();
    });
    
    await waitForNextUpdate();
    
    // Now approve task, which will fail
    act(() => {
      result.current.approveTask();
    });
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toEqual(errorMessage);
  });

  test('handles error when rejecting task', async () => {
    const mockTask = {
      id: '123',
      created_at: '2023-01-01T00:00:00Z',
      hash_value: 'abc123',
      source_id: 'source1',
      algorithm: 'pdq',
      content_category: 'adult',
      image_urls: ['https://example.com/image.jpg']
    };
    
    const errorMessage = 'Failed to reject task';
    (apiService.getNextTask as jest.Mock).mockResolvedValue(mockTask);
    (apiService.rejectTask as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    const { result, waitForNextUpdate } = renderHook(() => useReviewState());
    
    // Load task first
    act(() => {
      result.current.loadTask();
    });
    
    await waitForNextUpdate();
    
    // Now reject task, which will fail
    act(() => {
      result.current.rejectTask();
    });
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toEqual(errorMessage);
  });

  // Invalid inputs
  test('handles approve action when no task is loaded', () => {
    const { result } = renderHook(() => useReviewState());
    
    act(() => {
      result.current.approveTask();
    });
    
    expect(apiService.approveTask).not.toHaveBeenCalled();
    expect(result.current.error).toEqual('No task to approve');
  });

  test('handles reject action when no task is loaded', () => {
    const { result } = renderHook(() => useReviewState());
    
    act(() => {
      result.current.rejectTask();
    });
    
    expect(apiService.rejectTask).not.toHaveBeenCalled();
    expect(result.current.error).toEqual('No task to reject');
  });
}); 