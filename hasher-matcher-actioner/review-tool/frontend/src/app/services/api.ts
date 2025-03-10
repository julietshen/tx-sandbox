import { QueueStats, QueueConfig } from '../types/queue';
import { getMockQueueStats, getMockQueueConfig, getMockTask } from '../utils/mockData';

/**
 * Global flag for using mock data instead of real API calls
 * This allows easy toggling between real and mock data for development
 * without changing code in multiple places
 */
export const useMockData = true;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Generic API call handler with error handling
 */
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Queue API functions
 */
export const QueueAPI = {
  /**
   * Get queue configuration options
   */
  getQueueConfig: async (): Promise<QueueConfig> => {
    if (useMockData) {
      return getMockQueueConfig();
    }
    return apiCall<QueueConfig>('/queues/config');
  },

  /**
   * Get statistics for all queues with optional filters
   */
  getQueueStats: async (params?: {
    contentCategory?: string;
    hashAlgorithm?: string;
    isEscalated?: boolean;
  }): Promise<QueueStats[]> => {
    if (useMockData) {
      return getMockQueueStats(
        params?.contentCategory,
        params?.hashAlgorithm,
        params?.isEscalated
      );
    }
    
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.contentCategory) queryParams.append('content_category', params.contentCategory);
    if (params?.hashAlgorithm) queryParams.append('hash_algorithm', params.hashAlgorithm);
    if (params?.isEscalated !== undefined) queryParams.append('is_escalated', params.isEscalated.toString());
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    return apiCall<QueueStats[]>(`/queues/stats${queryString}`);
  },

  /**
   * Get the next task from the queue
   */
  getNextTask: async () => {
    if (useMockData) {
      // Get task from mock data
      const { task } = getMockTask();
      return task;
    }
    
    return apiCall(`/queues/next`);
  },

  /**
   * Complete a task with a review decision
   */
  completeTask: async (jobId: string, result: 'approved' | 'rejected' | 'escalated', notes?: string) => {
    const formData = new FormData();
    formData.append('result', result);
    if (notes) formData.append('notes', notes);
    
    return apiCall(`/queues/tasks/${jobId}/complete`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type here, it will be set automatically for FormData
      }
    });
  },

  /**
   * Add a new task to the queue
   */
  addTask: async (taskData: {
    image_id: number;
    content_category: string;
    hash_algorithm: string;
    confidence_level: string;
    is_escalated?: boolean;
    priority?: number;
    metadata?: Record<string, any>;
  }) => {
    return apiCall('/queues/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  },
  
  /**
   * Submit images for batch processing using existing queue infrastructure
   * This uses the existing HMA functionality
   */
  submitBatchImages: async (files: File[], algorithms: string[], category: string) => {
    if (useMockData) {
      // Only run in browser environment to avoid hydration mismatch
      if (typeof window === 'undefined') {
        return [];
      }

      // For demo purposes, simulate batch processing using existing mock data
      // This doesn't create a new API, just uses the existing mock infrastructure
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return files.map((file, index) => {
        const hasMatch = index % 3 === 0; // Every third file has a match for demo
        
        return {
          filename: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          category,
          queueAdded: true,
          hashAlgorithms: algorithms,
          taskId: `task_${Date.now()}_${index}`, // This would normally come from the server
          matches: hasMatch,
          matchDetails: hasMatch ? algorithms.map(algo => ({
            algorithm: algo,
            distance: 20 + (index * 5) % 30, // Demo value
            matchId: `match_${algo}_${index}`
          })) : []
        };
      });
    }
    
    // In a real implementation, this would use the existing HMA API to:
    // 1. Upload the images
    // 2. Create tasks for them in the queue
    // 3. Return results
    
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });
    formData.append('algorithms', JSON.stringify(algorithms));
    formData.append('category', category);
    
    return apiCall('/queues/batch-process', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type here, it will be set automatically for FormData
      }
    });
  }
};

/**
 * Image API functions
 */
export const ImageAPI = {
  /**
   * Get image details by ID
   */
  getImage: async (imageId: number) => {
    // Check for undefined or invalid imageId
    if (imageId === undefined || imageId === null) {
      console.error('Invalid image ID provided to getImage:', imageId);
      throw new Error('Invalid image ID provided');
    }
    return apiCall(`/images/${imageId}`);
  },
  
  /**
   * Get a list of images with optional filters
   */
  getImages: async (params?: {
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.sortBy) queryParams.append('sort_by', params.sortBy);
    if (params?.sortOrder) queryParams.append('sort_order', params.sortOrder);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    return apiCall(`/images${queryString}`);
  },
  
  /**
   * Get matches for an image
   */
  getImageMatches: async (imageId: number) => {
    // Check for undefined or invalid imageId
    if (imageId === undefined || imageId === null) {
      console.error('Invalid image ID provided to getImageMatches:', imageId);
      throw new Error('Invalid image ID provided');
    }
    return apiCall(`/images/${imageId}/matches`);
  }
};

export default {
  queue: QueueAPI,
  images: ImageAPI
}; 