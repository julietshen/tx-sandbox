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
  image_id: number;
  content_category: string;
  hash_algorithm: string;
  confidence_level: string;
  is_escalated: boolean;
  status: 'pending' | 'reviewed' | 'escalated';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  result?: 'approved' | 'rejected' | 'escalated';
  notes?: string;
  metadata?: Record<string, any>;
  pdq_hash?: string;
}

/**
 * Image interface
 */
export interface Image {
  id: number;
  filename: string;
  upload_date: string;
  url: string;
  size: number;
  width: number;
  height: number;
  mime_type: string;
  hashes: Array<{
    algorithm: string;
    hash: string;
    quality?: number;
  }>;
  task_id?: string;
  pdq_distance?: number;
}

/**
 * Match interface
 */
export interface Match {
  match_id: string;
  hash_algorithm: string;
  match_hash: string;
  distance: number;
  reference_id: string;
  reference_source: string;
  reference_type: string;
  reference_metadata?: Record<string, any>;
} 