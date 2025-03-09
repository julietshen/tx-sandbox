/**
 * Hook for managing review state
 * 
 * This hook provides a consistent way to manage review state including
 * loading tasks, submitting reviews, and handling mock data.
 */

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { QueueTask, Image, Match } from '../types/queue';
import { QueueAPI, ImageAPI } from '../services/api';
import { getMockTask } from '../utils/mockData';

export interface ReviewState {
  // Data
  currentTask: QueueTask | null;
  currentImage: Image | null;
  similarImages: Image[];
  matches: Match[];
  remainingCount: number;
  
  // UI state
  loading: boolean;
  submitting: boolean;
  error: string;
  
  // Actions
  loadNextTask: () => Promise<void>;
  handleApprove: (id: number, notes: string) => void;
  handleReject: (id: number, notes: string) => void;
  handleEscalate: (id: number, notes: string) => void;
  handleSkip: (id: number) => void;
}

export function useReviewState(
  useMockData: boolean,
  selectedCategory: string,
  selectedHashAlgorithm: string,
  selectedConfidenceLevel: string,
  showEscalated: boolean
): ReviewState {
  const toast = useToast();
  
  // Task data
  const [currentTask, setCurrentTask] = useState<QueueTask | null>(null);
  const [currentImage, setCurrentImage] = useState<Image | null>(null);
  const [similarImages, setSimilarImages] = useState<Image[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [remainingCount, setRemainingCount] = useState(0);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Load mock data
  const loadMockData = useCallback(() => {
    const mockData = getMockTask(
      selectedCategory,
      selectedHashAlgorithm,
      selectedConfidenceLevel,
      showEscalated
    );
    
    setCurrentTask(mockData.task);
    setCurrentImage(mockData.image);
    setMatches(mockData.matches);
    setSimilarImages(mockData.similarImages);
    setRemainingCount(Math.floor(Math.random() * 50) + 1);
    
    // Show mock data notice
    toast({
      title: 'Using Demo Data',
      description: 'Using local test images and mock data.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  }, [selectedCategory, selectedHashAlgorithm, selectedConfidenceLevel, showEscalated, toast]);
  
  // Fetch next task from API
  const fetchNextTask = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Prepare filters for API call
      const filters: {
        contentCategories?: string[];
        hashAlgorithms?: string[];
        confidenceLevels?: string[];
        isEscalated?: boolean;
      } = {};
      
      if (selectedCategory) filters.contentCategories = [selectedCategory];
      if (selectedHashAlgorithm) filters.hashAlgorithms = [selectedHashAlgorithm];
      if (selectedConfidenceLevel) filters.confidenceLevels = [selectedConfidenceLevel];
      if (showEscalated) filters.isEscalated = true;
      
      // Fetch next task
      const taskData = await QueueAPI.getNextTask(filters);
      
      if (taskData && taskData.imageId) {
        setCurrentTask(taskData);
        
        // Fetch image details
        const imageData = await ImageAPI.getImage(taskData.imageId);
        setCurrentImage(imageData);
        
        // Fetch image matches
        const matchesData = await ImageAPI.getImageMatches(taskData.imageId);
        if (matchesData) {
          setMatches(matchesData.matches || []);
          setSimilarImages(matchesData.similarImages || []);
        }
        
        // Get remaining count
        const statsData = await QueueAPI.getQueueStats({
          contentCategory: selectedCategory,
          hashAlgorithm: selectedHashAlgorithm,
          isEscalated: showEscalated
        });
        
        if (statsData && statsData.length > 0) {
          setRemainingCount(statsData[0].pending || 0);
        }
      } else {
        // No tasks available
        setCurrentTask(null);
        setCurrentImage(null);
        setMatches([]);
        setSimilarImages([]);
        setError('No tasks available with the current filters.');
      }
    } catch (err) {
      console.error('Failed to fetch next task', err);
      setError('Failed to fetch the next review task. Please try again.');
      
      if (useMockData) {
        loadMockData();
      }
    } finally {
      setLoading(false);
    }
  }, [
    selectedCategory, 
    selectedHashAlgorithm, 
    selectedConfidenceLevel, 
    showEscalated, 
    useMockData, 
    loadMockData
  ]);
  
  // Load next task (API or mock)
  const loadNextTask = useCallback(async () => {
    if (useMockData) {
      loadMockData();
    } else {
      await fetchNextTask();
    }
  }, [useMockData, loadMockData, fetchNextTask]);
  
  // Handle review action completion
  const completeReview = useCallback(async (
    result: 'approved' | 'rejected' | 'escalated',
    notes?: string
  ) => {
    try {
      if (!currentTask || !currentImage) {
        setError('No task loaded to complete.');
        return;
      }
      
      setSubmitting(true);
      
      toast({
        title: 'Review Submitted',
        description: `Content was ${result}. ${notes ? `Notes: ${notes}` : ''}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      if (!useMockData) {
        // In a real implementation, we would call the API
        try {
          await QueueAPI.completeTask(currentTask.id, result, notes);
        } catch (err) {
          console.error('Error completing task:', err);
          // Continue anyway and load next task
        }
      }
      
      // Load next task
      await loadNextTask();
      
    } catch (err) {
      console.error('Failed to complete review', err);
      setError('Failed to submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [currentTask, currentImage, toast, useMockData, loadNextTask]);
  
  // Handle review actions
  const handleApprove = useCallback((id: number, notes: string) => {
    completeReview('approved', notes);
  }, [completeReview]);
  
  const handleReject = useCallback((id: number, notes: string) => {
    completeReview('rejected', notes);
  }, [completeReview]);
  
  const handleEscalate = useCallback((id: number, notes: string) => {
    completeReview('escalated', notes);
  }, [completeReview]);
  
  const handleSkip = useCallback((id: number) => {
    try {
      setSubmitting(true);
      toast({
        title: 'Task Skipped',
        description: 'Moving to the next task',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      // Load next task
      loadNextTask();
    } catch (err) {
      console.error('Failed to skip to next task', err);
      setError('Failed to skip to the next task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [toast, loadNextTask]);
  
  // Load initial task on mount
  useEffect(() => {
    loadNextTask();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  return {
    // Data
    currentTask,
    currentImage,
    similarImages,
    matches,
    remainingCount,
    
    // UI state
    loading,
    submitting,
    error,
    
    // Actions
    loadNextTask,
    handleApprove,
    handleReject,
    handleEscalate,
    handleSkip
  };
} 