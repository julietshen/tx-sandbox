/**
 * Queue statistics interface
 */
export interface QueueStats {
  queueName: string;
  contentCategory: string;
  hashAlgorithm: string;
  isEscalated: boolean;
  pending: number;
  active: number;
  completed: number;
  successRate: number;
  oldestTaskAge: number;
}

/**
 * Queue configuration interface
 */
export interface QueueConfig {
  hashAlgorithms: string[];
  contentCategories: string[];
  confidenceLevels: string[];
}

/**
 * Queue task interface
 */
export interface QueueTask {
  id: string;
  imageId: number;
  contentCategory: string;
  hashAlgorithm: string;
  confidenceLevel: string;
  isEscalated: boolean;
  status: 'pending' | 'active' | 'completed';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: 'approved' | 'rejected' | 'escalated';
  notes?: string;
  metadata?: Record<string, any>;
}

/**
 * Image interface
 */
export interface Image {
  id: number;
  filename: string;
  upload_date: string;
  url: string;
  hashes: Array<{
    algorithm: string;
    hash: string;
    quality?: number;
  }>;
}

/**
 * Match interface
 */
export interface Match {
  id: number;
  algorithm: string;
  distance: number;
  match_date: string;
  matched_image_id: number;
  matched_image_filename: string;
} 