/**
 * Formatting utilities for the HMA Review Tool
 */

/**
 * Format a duration in seconds to a human-readable string
 * Preserves the simplified duration display we implemented
 */
export function formatDuration(seconds: number): string {
  if (seconds === 0) return 'None';
  
  if (seconds < 60) return `${seconds}s`;
  
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  }
  
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours}h`;
  }
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}

/**
 * Format a timestamp to a human-readable string
 */
export function formatTimestamp(timestamp?: string): string {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Format a content category string to title case with spaces
 * Example: "hate_speech" -> "Hate Speech"
 */
export function formatContentCategory(category: string): string {
  return category.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

/**
 * Get a color for a hash algorithm
 */
export function getAlgorithmColor(algorithm: string): string {
  switch (algorithm.toLowerCase()) {
    case 'pdq': return 'blue';
    case 'md5': return 'purple';
    case 'sha1': return 'teal';
    case 'sha256': return 'cyan';
    case 'escalated': return 'red';
    case 'manual': return 'orange';
    default: return 'gray';
  }
}

/**
 * Get a color for a content category
 */
export function getCategoryColor(category: string): string {
  switch (category.toLowerCase()) {
    case 'hate_speech': return 'red';
    case 'adult': return 'pink';
    case 'violence': return 'orange';
    case 'terrorism': return 'purple';
    case 'self_harm': return 'teal';
    case 'spam': return 'blue';
    default: return 'gray';
  }
} 