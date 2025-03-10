/**
 * HashIndexService.ts
 * 
 * This service provides a centralized way to index images from all sources
 * of the hasher-matcher-actioner demo, ensuring that all uploaded images are available
 * for similarity search.
 */

// API endpoint for the backend
const BACKEND_API_ENDPOINT = 'http://localhost:8000';
// API endpoint for our Next.js API routes
const NEXTJS_API_ENDPOINT = '/api';

/**
 * Indexes an image in the hasher-matcher-actioner database
 * @param image The image file to index
 * @param source The source of the image (for metadata)
 * @returns Promise that resolves when indexing is complete
 */
export const indexImage = async (image: File, source: string): Promise<void> => {
  try {
    // The /find_nearest endpoint automatically indexes the image
    const formData = new FormData();
    formData.append('image', image);
    
    // Use the backend API directly for indexing to ensure it works properly
    const response = await fetch(`${BACKEND_API_ENDPOINT}/find_nearest`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to index image: ${response.statusText}`);
    }
    
    console.log(`Image ${image.name} indexed from ${source}`);
  } catch (error) {
    console.error('Failed to index image:', error);
    throw error;
  }
};

/**
 * Checks if the database has any indexed images
 * @returns Promise that resolves to true if there are indexed images, false otherwise
 */
export const hasIndexedImages = async (): Promise<boolean> => {
  try {
    // Use our Next.js API route
    const response = await fetch(`${NEXTJS_API_ENDPOINT}/random_hash`);
    return response.ok;
  } catch (error) {
    console.error('Failed to check for indexed images:', error);
    return false;
  }
};

/**
 * Gets a random hash from the database
 * @returns Promise that resolves to the random hash data, or null if none exists
 */
export const getRandomHash = async (): Promise<any | null> => {
  try {
    // Use our Next.js API route
    const response = await fetch(`${NEXTJS_API_ENDPOINT}/random_hash`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to get random hash:', error);
    return null;
  }
};

/**
 * Finds nearest matches for an image or hash using PDQ algorithm
 * @param image Optional image file to find matches for
 * @param hashValue Optional hash value to find matches for
 * @param threshold Optional threshold for PDQ distance (default: 100)
 * @returns Promise that resolves to the matches data
 */
export const findNearestMatches = async (
  image: File | null = null,
  hashValue: string | null = null,
  threshold: number = 100
): Promise<any> => {
  try {
    const formData = new FormData();
    
    if (image) {
      formData.append('image', image);
    } else if (hashValue) {
      formData.append('hash_value', hashValue);
    } else {
      throw new Error('Either image or hashValue must be provided');
    }
    
    // Add algorithm and threshold parameters
    formData.append('algorithm', 'pdq');
    formData.append('threshold', threshold.toString());

    // Use our Next.js API route
    const response = await fetch(`${NEXTJS_API_ENDPOINT}/find_nearest`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to find nearest matches');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to find nearest matches:', error);
    throw error;
  }
};

export default {
  indexImage,
  hasIndexedImages,
  getRandomHash,
  findNearestMatches
}; 