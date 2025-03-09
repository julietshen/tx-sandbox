'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  useToast,
  Center,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  Table,
  Tbody,
  Tr,
  Td,
  Button,
  Select,
  useColorModeValue,
  Divider,
  Card,
  CardBody,
  CardHeader,
  Icon,
  Tooltip,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  SimpleGrid,
  Image as ChakraImage,
} from '@chakra-ui/react';
import { ChevronRightIcon, InfoIcon } from '@chakra-ui/icons';
import AppLayout from '../components/layout/AppLayout';
import ImageCard from '../components/review/ImageCard';
import MatchDetails from '../components/review/MatchDetails';
import ReviewActions from '../components/review/ReviewActions';
import { QueueAPI, ImageAPI } from '../services/api';
import { QueueTask, Image as ImageType, Match, QueueConfig } from '../types/queue';

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  
  // Use mock data only - set to true to disable real API calls
  const useMockDataOnly = true;
  
  // Get task ID from URL if available
  const taskIdFromUrl = searchParams.get('taskId');
  
  // Task data
  const [currentTask, setCurrentTask] = useState<QueueTask | null>(null);
  const [currentImage, setCurrentImage] = useState<ImageType | null>(null);
  const [similarImages, setSimilarImages] = useState<ImageType[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  
  // Queue data
  const [taskQueue, setTaskQueue] = useState<QueueTask[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [remainingCount, setRemainingCount] = useState(0);
  
  // Queue configuration
  const [config, setConfig] = useState<QueueConfig | null>(null);
  
  // Get queue name for display
  const getQueueDisplayName = () => {
    if (currentTask?.content_category && currentTask?.hash_algorithm) {
      const category = currentTask.content_category.split('_').map(
        word => word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      const algorithm = currentTask.hash_algorithm.toUpperCase();
      
      return `${category} (${algorithm})`;
    }
    return 'Content Review';
  };

  // Get time from timestamp
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Get mock task queue
  const getMockTaskQueue = useCallback(() => {
    // Limit to unique content categories
    const uniqueCategories = ['fowl_play', 'wild_duckery', 'rotten_eggs'];
    const algorithms = ['pdq', 'md5', 'sha256'];
    const confidenceLevels = ['low', 'medium', 'high'];
    
    // Create one task for each unique category
    return uniqueCategories.map((category, i) => ({
      id: `mock-task-${i+1}`,
      image_id: i+1,
      content_category: category,
      hash_algorithm: algorithms[i % algorithms.length],
      confidence_level: confidenceLevels[i % confidenceLevels.length],
      is_escalated: false, // All tasks start as not escalated
      status: 'unreviewed', // All tasks start as unreviewed
      created_at: new Date(Date.now() - i * 3600000).toISOString(), // Each task 1 hour apart
      metadata: {
        source: `Source ${i+1}`,
        reporter: i % 2 === 0 ? 'User' : 'System',
        report_reason: `Reason ${i+1}`
      },
      // Store PDQ hash for similarity matching
      pdq_hash: `pdq_${i}_${Math.random().toString(36).substring(2, 8)}`
    }));
  }, []);
  
  // Calculate PDQ hash distance (mock implementation)
  const calculatePDQDistance = useCallback((hash1: string, hash2: string) => {
    // In a real implementation, this would compare actual PDQ hashes
    // For mock purposes, extract the task number from the hash and use that
    const id1 = parseInt(hash1.split('_')[1]) || 0;
    const id2 = parseInt(hash2.split('_')[1]) || 0;
    
    // Return a distance based on how far apart the task IDs are
    // Closer IDs = more similar images (lower distance)
    const baseDist = Math.abs(id1 - id2);
    
    // Add some randomness but keep similar tasks similar
    return baseDist * 10 + Math.floor(Math.random() * 10);
  }, []);
  
  // Get mock image for a task
  const getMockImage = useCallback((taskId: string) => {
    const id = parseInt(taskId.split('-').pop() || '1');
    const imageIndex = ((id - 1) % 5) + 8; // Use photo8.jpg through photo12.jpg
    
    // Find the task to match its creation date
    const task = taskQueue.find(t => t.id === taskId);
    
    // Generate a publish date that's a bit before the task was created
    // This simulates content being published and then flagged for review
    const taskCreatedAt = task ? new Date(task.created_at) : new Date();
    const publishDate = new Date(taskCreatedAt);
    
    // Make the publish date between 1-24 hours before the task was created
    const hoursOffset = Math.floor(Math.random() * 24) + 1;
    publishDate.setHours(publishDate.getHours() - hoursOffset);
    
    return {
      id: id,
      filename: `test_image_${id}.jpg`,
      upload_date: publishDate.toISOString(), // Use the calculated publish date
      url: `/test_images/photo${imageIndex}.jpg`, // Local test image
      size: 10000 + id * 1000,
      width: 800,
      height: 600,
      mime_type: 'image/jpeg',
      hashes: [
        {
          algorithm: 'pdq',
          hash: `pdq_${id-1}_${Math.random().toString(36).substring(2, 8)}`, // Include task ID in hash for similarity
          quality: 85 + id
        }
      ],
      // Associated task ID for navigation
      task_id: taskId
    };
  }, [taskQueue]);
  
  // Get mock matches for a task
  const getMockMatches = useCallback((taskId: string) => {
    const id = parseInt(taskId.split('-').pop() || '1');
    return [
      {
        match_id: `m${id}`,
        hash_algorithm: 'pdq',
        match_hash: `pdq_${id-1}_${Math.random().toString(36).substring(2, 8)}`,
        distance: 5,
        reference_id: `ref${id}`,
        reference_source: 'internal database',
        reference_type: 'known_content',
        reference_metadata: {
          category: id % 3 === 0 ? 'hate_speech' : id % 2 === 0 ? 'misinformation' : 'harmful_content',
          severity: id % 2 === 0 ? 'high' : 'medium',
          added_date: new Date().toISOString()
        }
      }
    ];
  }, []);
  
  // Find similar images using PDQ
  const findSimilarImagesUsingPDQ = useCallback((currentTaskId: string, allTasks: QueueTask[]) => {
    const curTask = allTasks.find(t => t.id === currentTaskId);
    if (!curTask) return [];
    
    // Get current task's PDQ hash
    const currentPDQHash = curTask.pdq_hash;
    
    // Find other tasks with similar PDQ hashes
    // Sort by similarity (PDQ distance)
    const similarTasks = allTasks
      .filter(task => task.id !== currentTaskId) // Exclude current task
      .map(task => ({
        task,
        distance: calculatePDQDistance(currentPDQHash, task.pdq_hash)
      }))
      .sort((a, b) => a.distance - b.distance) // Sort by distance (ascending)
      .slice(0, 3); // Take top 3 most similar
      
    // Convert to Image objects with task_id for navigation
    return similarTasks.map(({ task }) => {
      const taskId = parseInt(task.id.split('-').pop() || '1');
      const imageIndex = ((taskId - 1) % 5) + 8;
      
      return {
        id: taskId,
        filename: `similar_${taskId}.jpg`,
        upload_date: new Date().toISOString(),
        url: `/test_images/photo${imageIndex}.jpg`,
        size: 9000 + taskId * 500,
        width: 800,
        height: 600,
        mime_type: 'image/jpeg',
        hashes: [
          {
            algorithm: 'pdq',
            hash: task.pdq_hash,
            quality: 80 + taskId
          }
        ],
        // Store the task ID for navigation
        task_id: task.id,
        // Store the PDQ distance for display
        pdq_distance: calculatePDQDistance(currentPDQHash, task.pdq_hash)
      };
    });
  }, [calculatePDQDistance]);
  
  // Use mock data for development - moved up to break circular dependency
  const useMockData = useCallback(() => {
    // Load mock task queue if not already loaded
    if (taskQueue.length === 0) {
      const mockQueue = getMockTaskQueue();
      setTaskQueue(mockQueue);
      setRemainingCount(mockQueue.length);
      
      // For initial load, no need to fetch a specific task yet
      // This will happen in the useEffect instead
    } else if (currentQueueIndex >= 0 && currentQueueIndex < taskQueue.length) {
      // Just reload current task
      const taskId = taskQueue[currentQueueIndex].id;
      // Find the task in queue
      const taskIndex = taskQueue.findIndex(task => task.id === taskId);
      if (taskIndex >= 0) {
        setCurrentQueueIndex(taskIndex);
        const taskData = taskQueue[taskIndex];
        setCurrentTask(taskData);
        
        // Get mock data for current task
        const imageData = getMockImage(taskData.id);
        setCurrentImage(imageData);
        
        const matchesData = getMockMatches(taskData.id);
        setMatches(matchesData);
        
        // Find similar images using PDQ
        const similarImagesData = findSimilarImagesUsingPDQ(taskData.id, taskQueue);
        setSimilarImages(similarImagesData);
      }
    }
  }, [taskQueue, currentQueueIndex, getMockTaskQueue, getMockImage, getMockMatches, findSimilarImagesUsingPDQ]);
  
  // Fetch a specific task by ID
  const fetchTaskById = useCallback(async (taskId: string) => {
    try {
      setLoading(true);
      setError('');
      
      // In a real implementation, this would call the API
      // For the mock implementation, find the task in the queue
      const taskIndex = taskQueue.findIndex(task => task.id === taskId);
      
      if (taskIndex >= 0) {
        setCurrentQueueIndex(taskIndex);
        const taskData = taskQueue[taskIndex];
        
        setCurrentTask(taskData);
        
        // Get image, matches, and similar images
        // In a real implementation, these would be API calls
        const imageData = getMockImage(taskData.id);
        setCurrentImage(imageData);
        
        const matchesData = getMockMatches(taskData.id);
        setMatches(matchesData);
        
        // Find similar images using PDQ
        const similarImagesData = findSimilarImagesUsingPDQ(taskData.id, taskQueue);
        setSimilarImages(similarImagesData);
      } else {
        // Task not found, show error
        setError(`Task ID ${taskId} not found in queue`);
      }
    } catch (err) {
      console.error('Error in fetchTaskById', err);
      setError('Failed to fetch the requested task.');
    } finally {
      setLoading(false);
    }
  }, [taskQueue, getMockImage, getMockMatches, findSimilarImagesUsingPDQ]);
  
  // Navigate to next task in queue
  const goToNextTask = useCallback(() => {
    if (currentQueueIndex < taskQueue.length - 1) {
      fetchTaskById(taskQueue[currentQueueIndex + 1].id);
    } else {
      // At the end of the queue, show notification
      toast({
        title: 'End of Queue',
        description: 'You have reached the end of the current queue.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [currentQueueIndex, taskQueue, fetchTaskById, toast]);
  
  // Navigate to previous task in queue
  const goToPreviousTask = useCallback(() => {
    if (currentQueueIndex > 0) {
      fetchTaskById(taskQueue[currentQueueIndex - 1].id);
    } else {
      // At the beginning of the queue, show notification
      toast({
        title: 'Start of Queue',
        description: 'You are at the beginning of the current queue.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [currentQueueIndex, taskQueue, fetchTaskById, toast]);
  
  // Fetch the next task from the API
  const fetchNextTask = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch queue configuration if not already loaded
      if (!config) {
        try {
          const configData = await QueueAPI.getQueueConfig();
          setConfig(configData);
        } catch (err) {
          console.error('Failed to fetch queue configuration', err);
          // Continue with null config, we'll handle it later
        }
      }
      
      // For demo purposes, we'll just go to the next task in our mock queue
      if (currentQueueIndex < taskQueue.length - 1) {
        fetchTaskById(taskQueue[currentQueueIndex + 1].id);
      } else {
        // At the end of the queue, show notification
        toast({
          title: 'End of Queue',
          description: 'You have reached the end of the current queue.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Error in fetchNextTask', err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to fetch the next review task. Please try again.');
      } else {
        setError('Failed to fetch the next review task. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [config, currentQueueIndex, taskQueue, fetchTaskById, toast]);

  // Initialize task queue
  useEffect(() => {
    // This function ensures we don't have dependency cycles
    const initializeQueue = () => {
      // Load mock task queue
      const mockQueue = getMockTaskQueue();
      setTaskQueue(mockQueue);
      setRemainingCount(mockQueue.length);
    };
    
    initializeQueue();
  }, [getMockTaskQueue]); // Only depends on getMockTaskQueue
  
  // Load initial task
  useEffect(() => {
    // Skip if taskQueue is empty or fetchTaskById isn't available yet
    if (taskQueue.length === 0) return;
    
    // If taskId is provided in URL, load that task
    if (taskIdFromUrl) {
      const taskIndex = taskQueue.findIndex(task => task.id === taskIdFromUrl);
      if (taskIndex >= 0) {
        fetchTaskById(taskIdFromUrl);
      } else {
        // If task not found, load first task
        fetchTaskById(taskQueue[0].id);
      }
    } else {
      // Otherwise load first task
      fetchTaskById(taskQueue[0].id);
    }
  }, [taskQueue, taskIdFromUrl, fetchTaskById]); // Depends on taskQueue being populated
  
  // Handle review action completion
  const completeReview = async (
    result: 'approved' | 'rejected' | 'escalated',
    notes?: string
  ) => {
    try {
      if (!currentTask || !currentImage) {
        setError('No task loaded to complete.');
        return;
      }
      
      setSubmitting(true);
      
      // For development/testing - show success toast
      toast({
        title: 'Review Submitted',
        description: `Content was ${result}. ${notes ? `Notes: ${notes}` : ''}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Create updated queue with the completed task
      const updatedQueue = [...taskQueue];
      if (currentTask && currentQueueIndex < updatedQueue.length) {
        updatedQueue[currentQueueIndex] = {
          ...updatedQueue[currentQueueIndex],
          status: 'completed',
          result: result,
          notes: notes
        };
        
        // Determine next task index
        const nextIndex = currentQueueIndex < taskQueue.length - 1 ? currentQueueIndex + 1 : -1;
        
        // Update queue first, then navigate in the callback to ensure state is updated before navigation
        setTaskQueue(updatedQueue);
        setRemainingCount(prev => Math.max(0, prev - 1));
        
        // Use setTimeout to ensure the state updates have been applied before navigating
        setTimeout(() => {
          setSubmitting(false);
          
          // Navigate to next task if available
          if (nextIndex >= 0) {
            fetchTaskById(updatedQueue[nextIndex].id);
          } else {
            // At the end of the queue, show notification
            toast({
              title: 'Queue Complete',
              description: 'You have completed all tasks in the queue.',
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
          }
        }, 50); // Small delay to ensure state updates are processed
      } else {
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Failed to complete review', err);
      setError('Failed to submit your review. Please try again.');
      setSubmitting(false);
    }
  };
  
  // Handle review actions
  const handleApprove = (id: number, notes: string) => {
    completeReview('approved', notes);
    // Next task is automatically loaded in completeReview
  };
  
  const handleReject = (id: number, notes: string) => {
    completeReview('rejected', notes);
    // Next task is automatically loaded in completeReview
  };
  
  // Handle review action completion for escalation specifically
  const handleEscalate = (id: number, notes: string) => {
    try {
      if (!currentTask || !currentImage) {
        setError('No task loaded to complete.');
        return;
      }
      
      setSubmitting(true);
      
      // For development/testing - show success toast
      toast({
        title: 'Task Escalated',
        description: `Content has been escalated to a senior reviewer. ${notes ? `Notes: ${notes}` : ''}`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      
      // Mark task as escalated in the queue
      const updatedQueue = [...taskQueue];
      if (currentTask && currentQueueIndex < updatedQueue.length) {
        updatedQueue[currentQueueIndex] = {
          ...updatedQueue[currentQueueIndex],
          status: 'completed', // Mark original task as completed
          result: 'escalated',
          is_escalated: true, // Flag as escalated
          notes: notes,
          // In a real implementation, this would create a new task in the escalations queue
          // and link it to this original task
        };
        setTaskQueue(updatedQueue);
        setRemainingCount(prev => Math.max(0, prev - 1));
      }
      
      // Move to next task automatically
      if (currentQueueIndex < taskQueue.length - 1) {
        goToNextTask();
      } else {
        // At the end of the queue, show notification
        toast({
          title: 'Queue Complete',
          description: 'You have completed all tasks in this queue.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      setSubmitting(false);
    } catch (err) {
      console.error('Failed to escalate review', err);
      setError('Failed to escalate this task. Please try again.');
      setSubmitting(false);
    }
  };
  
  const handleSkip = (id: number) => {
    try {
      setSubmitting(true);
      toast({
        title: 'Task Skipped',
        description: 'Moving to the next task in the queue',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      // Move to next task
      goToNextTask();
    } catch (err) {
      console.error('Failed to skip to next task', err);
      setError('Failed to skip to the next task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Color mode
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.800');
  
  // Check if all tasks in queue are completed
  const allTasksCompleted = useCallback(() => {
    return taskQueue.length > 0 && taskQueue.every(task => task.status === 'completed');
  }, [taskQueue]);
  
  return (
    <AppLayout>
      {/* Breadcrumb Navigation */}
      <Box mb={4}>
        <Breadcrumb spacing="8px" separator={<ChevronRightIcon color="gray.500" />}>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink href="#">Review: {getQueueDisplayName()}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Box>
      
      {/* Page Header */}
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Flex alignItems="center" gap={2}>
            <Heading size="lg">Review: {getQueueDisplayName()}</Heading>
            {currentTask && (
              <Badge colorScheme="teal" fontSize="md" p={1}>
                Task ID: {currentTask.id}
              </Badge>
            )}
          </Flex>
          <Text mt={1} color="gray.500">
            Here, you can review content that has been flagged based on hash matching.
            {` Queue position: ${currentQueueIndex + 1}/${taskQueue.length}`}
            {remainingCount > 0 && ` (${remainingCount} items pending)`}
          </Text>
        </Box>
        
        <HStack spacing={2}>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
            size="sm"
          >
            Back to Dashboard
          </Button>
          <Button 
            colorScheme="gray" 
            onClick={goToPreviousTask} 
            isDisabled={loading || submitting || currentQueueIndex === 0}
            size="sm"
            leftIcon={<ChevronRightIcon transform="rotate(180deg)" />}
          >
            Previous
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={goToNextTask} 
            isLoading={loading || submitting}
            isDisabled={currentQueueIndex >= taskQueue.length - 1}
            size="sm"
            rightIcon={<ChevronRightIcon />}
          >
            Skip to Next
          </Button>
        </HStack>
      </Flex>
      
      {/* Progress Bar */}
      <Box mb={4} bg="gray.100" borderRadius="full" height="8px" overflow="hidden">
        <Box 
          bg="blue.500" 
          height="100%" 
          width={`${(currentQueueIndex + 1) / taskQueue.length * 100}%`}
          transition="width 0.3s ease-in-out"
        />
      </Box>
      
      {/* Error Message */}
      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      {/* Content Loading State */}
      {loading && (
        <Center p={10}>
          <VStack spacing={4}>
            <Spinner size="xl" />
            <Text>Loading content for review...</Text>
          </VStack>
        </Center>
      )}
      
      {/* Main Content */}
      {!loading && currentTask && currentImage && (
        <Grid 
          templateColumns={{ base: '1fr', lg: '2fr 1fr' }} 
          gap={6}
        >
          {/* Left Column - Content Information */}
          <GridItem>
            <Card borderColor={borderColor} boxShadow="sm" mb={6}>
              <CardHeader bg={headerBg} py={3}>
                <Flex justifyContent="space-between" alignItems="center">
                  <Heading size="md">Content</Heading>
                  <HStack spacing={2}>
                    <Badge colorScheme="blue">{currentTask.hash_algorithm.toUpperCase()}</Badge>
                    <Badge colorScheme="purple">{currentTask.confidence_level.toUpperCase()}</Badge>
                    {currentTask.is_escalated && <Badge colorScheme="red">ESCALATED</Badge>}
                  </HStack>
                </Flex>
              </CardHeader>
              <CardBody>
                <ImageCard 
                  image={currentImage} 
                  selectedAlgorithm={currentTask.hash_algorithm}
                />
              </CardBody>
            </Card>
            
            <Card borderColor={borderColor} boxShadow="sm">
              <CardHeader bg={headerBg} py={3}>
                <Flex justifyContent="space-between" alignItems="center">
                  <Heading size="md">Content Details</Heading>
                </Flex>
              </CardHeader>
              <CardBody>
                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                  <Box>
                    <Table variant="simple" size="sm">
                      <Tbody>
                        <Tr>
                          <Td fontWeight="bold" width="40%">Source</Td>
                          <Td>{currentTask.metadata?.source || 'Unknown'}</Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">Reported By</Td>
                          <Td>{currentTask.metadata?.reporter || 'System'}</Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">Report Reason</Td>
                          <Td>{currentTask.metadata?.report_reason || 'Hash match detection'}</Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">Reported At</Td>
                          <Td>{formatTimestamp(currentTask.created_at)}</Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </Box>
                  
                  <Box>
                    <Table variant="simple" size="sm">
                      <Tbody>
                        <Tr>
                          <Td fontWeight="bold" width="40%">Filename</Td>
                          <Td>{currentImage.filename}</Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">File Type</Td>
                          <Td>{currentImage.mime_type}</Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">Dimensions</Td>
                          <Td>{currentImage.width}x{currentImage.height}</Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">Upload Date</Td>
                          <Td>{formatTimestamp(currentImage.upload_date)}</Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </Box>
                </Grid>
              </CardBody>
            </Card>
          </GridItem>
          
          {/* Right Column - Decision & Matches */}
          <GridItem>
            <VStack spacing={6} align="stretch">
              {/* Review Actions */}
              <Card borderColor={borderColor} boxShadow="sm">
                <CardHeader bg={headerBg} py={3}>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Heading size="md">Decision</Heading>
                    <Tooltip label="Make a decision about this content based on your platform's policies">
                      <span><InfoIcon /></span>
                    </Tooltip>
                  </Flex>
                </CardHeader>
                <CardBody>
                  <ReviewActions
                    imageId={currentImage.id}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onEscalate={handleEscalate}
                    onSkip={handleSkip}
                    isProcessing={submitting}
                    tasksRemaining={taskQueue.length - currentQueueIndex - 1 > 0}
                  />
                </CardBody>
              </Card>
              
              {/* Match Details */}
              {matches.length > 0 && (
                <Card borderColor={borderColor} boxShadow="sm">
                  <CardHeader bg={headerBg} py={3}>
                    <Flex justifyContent="space-between" alignItems="center">
                      <Heading size="md">Match Details</Heading>
                      <Badge colorScheme="red">{matches.length} match(es)</Badge>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Box>
                      <MatchDetails matches={matches} />
                    </Box>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </GridItem>
        </Grid>
      )}
      
      {/* Similar Content */}
      {!loading && currentTask && similarImages.length > 0 && (
        <Card borderColor={borderColor} boxShadow="sm" mb={6} mt={6}>
          <CardHeader bg={headerBg} py={3}>
            <Flex justifyContent="space-between" alignItems="center">
              <Heading size="md">Similar Content (PDQ)</Heading>
              <Badge colorScheme="purple">
                {similarImages.length} similar items
              </Badge>
            </Flex>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm">
                The following content was identified as visually similar using PDQ perceptual hashing:
              </Text>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                {similarImages.map((image) => (
                  <Box 
                    key={image.id} 
                    position="relative" 
                    borderWidth="1px" 
                    borderRadius="md" 
                    borderColor={borderColor}
                    overflow="hidden"
                    cursor="pointer"
                    onClick={() => {
                      // Open the task in a new tab
                      if (image.task_id) {
                        window.open(`/review?taskId=${image.task_id}`, '_blank');
                      }
                    }}
                    transition="transform 0.2s"
                    _hover={{ transform: 'scale(1.02)' }}
                  >
                    <ChakraImage 
                      src={image.url}
                      alt={`Similar image ${image.id}`}
                      width="100%"
                      height="150px"
                      objectFit="cover"
                    />
                    <Box p={2}>
                      <Badge colorScheme="blue">
                        TASK: MOCK-TASK-{image.id}
                      </Badge>
                      <Text fontSize="xs" mt={1}>
                        PDQ Distance: {image.pdq_distance || 'N/A'}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Click to view task in new tab
                      </Text>
                    </Box>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>
      )}
      
      {/* No Content State */}
      {!loading && !currentTask && !allTasksCompleted() && (
        <Center p={10}>
          <VStack spacing={4} textAlign="center">
            <Heading size="md">No Content to Review</Heading>
            <Text>There are no items in the queue that match your current filters.</Text>
            <Button 
              colorScheme="blue" 
              onClick={() => router.push('/dashboard')}
            >
              Return to Dashboard
            </Button>
          </VStack>
        </Center>
      )}
      
      {/* Queue Complete State */}
      {!loading && allTasksCompleted() && (
        <Center p={10}>
          <VStack spacing={6} textAlign="center">
            <Box 
              borderRadius="full" 
              bg="green.100" 
              color="green.500" 
              p={5}
              fontSize="4xl"
            >
              ✓
            </Box>
            <Heading size="lg">Queue Complete</Heading>
            <Text fontSize="lg">
              You have reviewed all tasks in this queue. Nice work!
            </Text>
            <Text color="gray.500" mb={4}>
              You can return to the dashboard to select another queue or check for new tasks.
            </Text>
            <HStack spacing={4}>
              <Button
                colorScheme="blue"
                onClick={() => router.push('/dashboard')}
                size="lg"
              >
                Return to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Reset the queue
                  const mockQueue = getMockTaskQueue();
                  setTaskQueue(mockQueue);
                  setRemainingCount(mockQueue.length);
                  
                  if (mockQueue.length > 0) {
                    fetchTaskById(mockQueue[0].id);
                  }
                  
                  toast({
                    title: 'Queue Refreshed',
                    description: 'New tasks have been loaded.',
                    status: 'info',
                    duration: 3000,
                    isClosable: true,
                  });
                }}
              >
                Check for New Tasks
              </Button>
            </HStack>
          </VStack>
        </Center>
      )}
    </AppLayout>
  );
}