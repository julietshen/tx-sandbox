/**
 * Mock data utilities for the HMA Review Tool
 * 
 * This centralizes all mock data generation to avoid duplication across components.
 * It carefully preserves the manual adjustments we've made to handle edge cases.
 */

import { QueueStats, QueueConfig, QueueTask, Image, Match } from '../types/queue';

/**
 * Fixed set of realistic task durations we show in the UI
 * This preserves our solution to the "20156d 21h" issue
 */
export const mockDurations = [
  'None',
  '5m',
  '30m',
  '1h',
  '2h',
  '5h',
  '12h',
  '1d 0h',
  '1d 12h',
  '2d 0h',
  '2d 12h',
  '3d 0h'
];

/**
 * Fixed set of realistic task age values (in seconds) for mock data
 */
export const mockTaskAges = [
  0,           // No tasks
  300,         // 5 minutes
  1800,        // 30 minutes
  3600,        // 1 hour
  7200,        // 2 hours
  18000,       // 5 hours
  43200,       // 12 hours
  86400,       // 1 day
  129600,      // 1.5 days
  172800,      // 2 days
  259200       // 3 days
];

/**
 * Mock content categories
 */
export const mockCategories = [
  'fowl_play',
  'wild_duckery',
  'rotten_eggs'
];

/**
 * Mock hash algorithms
 */
export const mockHashTypes = [
  'pdq', 
  'md5', 
  'sha1', 
  'escalated', 
  'manual'
];

/**
 * Mock confidence levels
 */
export const mockConfidenceLevels = [
  'high', 
  'medium', 
  'low'
];

/**
 * Get mock queue statistics with realistic values
 */
export function getMockQueueStats(
  selectedCategory?: string,
  selectedHashAlgorithm?: string,
  showEscalated?: boolean
): QueueStats[] {
  const mockStats: QueueStats[] = [];
  let ageIndex = 0;
  
  // Generate mock data for each category and hash type
  mockCategories.forEach(category => {
    // Skip if a category filter is applied and doesn't match
    if (selectedCategory && category !== selectedCategory) return;
    
    mockHashTypes.forEach(hash => {
      // Skip escalated for normal queues
      if (hash === 'escalated' && !showEscalated) return;
      
      // Skip if a hash algorithm filter is applied and doesn't match
      if (selectedHashAlgorithm && hash !== selectedHashAlgorithm) return;
      
      const isEsc = hash === 'escalated';
      
      // Get a fixed age value and increment the index
      const oldestTaskAge = mockTaskAges[ageIndex % mockTaskAges.length];
      ageIndex++;
      
      // If age is 0, set pending to 0 as well
      const pending = oldestTaskAge === 0 ? 0 : (ageIndex % 25) + 1;
      
      mockStats.push({
        queueName: `review:${hash}:${category}${isEsc ? '_escalated' : ''}`,
        contentCategory: category,
        hashAlgorithm: hash,
        isEscalated: isEsc,
        pending,
        active: Math.floor(Math.random() * 10),
        completed: Math.floor(Math.random() * 100) + 50,
        successRate: Math.random() * 100,
        oldestTaskAge
      });
    });
  });
  
  return mockStats;
}

/**
 * Get mock queue configuration
 */
export function getMockQueueConfig(): QueueConfig {
  return {
    hashAlgorithms: mockHashTypes,
    contentCategories: mockCategories,
    confidenceLevels: mockConfidenceLevels
  };
}

/**
 * Get a description for a content category
 */
export function getMockCategoryDescription(category: string): string {
  const lowerCategory = category.toLowerCase();
  
  switch (lowerCategory) {
    case 'fowl_play':
      return 'Content that contains suspicious chicken-related activities or bird-themed humor';
    
    case 'wild_duckery':
      return 'Content with excessive waterfowl antics or questionable duck behavior';
    
    case 'rotten_eggs':
      return 'Content featuring spoiled breakfast ingredients or egg-related offenses';
    
    default:
      return 'Content that violates our policies';
  }
}

/**
 * Get a mock task with all related data for the review page
 */
export function getMockTask(
  selectedCategory?: string,
  selectedHashAlgorithm?: string,
  selectedConfidenceLevel?: string,
  showEscalated?: boolean
): { task: QueueTask, image: Image, matches: Match[], similarImages: Image[] } {
  // Use the provided filters or defaults
  const category = selectedCategory || 'fowl_play';
  const hashAlgorithm = selectedHashAlgorithm || 'pdq';
  const confidenceLevel = selectedConfidenceLevel || 'high';
  const isEscalated = showEscalated || false;
  
  // Create a task ID with the filters to make it clear when it changes
  const taskId = `mock-task-${category}-${hashAlgorithm}-${confidenceLevel}${isEscalated ? '-escalated' : ''}`;
  
  // Create the mock task
  const task: QueueTask = {
    id: taskId,
    imageId: 1,
    contentCategory: category,
    hashAlgorithm,
    confidenceLevel,
    isEscalated,
    status: 'pending',
    createdAt: new Date().toISOString(),
    metadata: {
      source: 'Mock Source',
      reporter: 'System',
      report_reason: 'Potentially violating content'
    }
  };
  
  // Create the mock image
  const image: Image = {
    id: 1,
    filename: 'test_image.jpg',
    upload_date: new Date().toISOString(),
    url: '/test_images/photo8.jpg', // Local test image
    hashes: [
      {
        algorithm: hashAlgorithm,
        hash: 'f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6',
        quality: 90
      }
    ]
  };
  
  // Create mock matches
  const matches: Match[] = [
    {
      id: 1,
      algorithm: hashAlgorithm,
      distance: 5,
      match_date: new Date().toISOString(),
      matched_image_id: 2,
      matched_image_filename: 'similar_1.jpg'
    }
  ];
  
  // Create mock similar images
  const similarImages: Image[] = [
    {
      id: 2,
      filename: 'similar_1.jpg',
      upload_date: new Date().toISOString(),
      url: '/test_images/photo9.jpg', // Local test image
      hashes: [
        {
          algorithm: hashAlgorithm,
          hash: 'f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7',
          quality: 85
        }
      ]
    },
    {
      id: 3,
      filename: 'similar_2.jpg',
      upload_date: new Date().toISOString(),
      url: '/test_images/photo10.jpg', // Local test image
      hashes: [
        {
          algorithm: hashAlgorithm,
          hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
          quality: 82
        }
      ]
    }
  ];
  
  return { task, image, matches, similarImages };
} 