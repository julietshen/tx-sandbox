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
} from '@chakra-ui/react';
import { ChevronRightIcon, InfoIcon } from '@chakra-ui/icons';
import AppLayout from '../components/layout/AppLayout';
import ImageCard from '../components/review/ImageCard';
import MatchDetails from '../components/review/MatchDetails';
import ReviewActions from '../components/review/ReviewActions';
import { QueueAPI, ImageAPI } from '../services/api';
import { QueueTask, Image, Match, QueueConfig } from '../types/queue';

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  
  // Use mock data only - set to true to disable real API calls
  const useMockDataOnly = true;
  
  // Task data
  const [currentTask, setCurrentTask] = useState<QueueTask | null>(null);
  const [currentImage, setCurrentImage] = useState<Image | null>(null);
  const [similarImages, setSimilarImages] = useState<Image[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [remainingCount, setRemainingCount] = useState(0);
  
  // Queue configuration
  const [config, setConfig] = useState<QueueConfig | null>(null);
  
  // Get queue name for display
  const getQueueDisplayName = () => {
    if (currentTask?.content_category && currentTask?.algorithm) {
      const category = currentTask.content_category.split('_').map(
        word => word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      const algorithm = currentTask.algorithm.toUpperCase();
      
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
      
      // Fetch next task
      let taskData;
      try {
        taskData = await QueueAPI.getNextTask();
      } catch (err) {
        console.error('Failed to fetch next task', err);
        throw new Error('Failed to fetch the next review task');
      }
      
      if (taskData && taskData.image_id) {
        setCurrentTask(taskData);
        
        // Fetch image details
        try {
          const imageData = await ImageAPI.getImage(taskData.image_id);
          setCurrentImage(imageData);
        } catch (err) {
          console.error('Failed to fetch image details', err);
          throw new Error('Failed to fetch image details for the current task');
        }
        
        // Fetch image matches
        try {
          const matchesData = await ImageAPI.getImageMatches(taskData.image_id);
          setMatches(matchesData?.matches || []);
          
          // Fetch similar images
          const similarImagesData = matchesData?.similar_images || [];
          setSimilarImages(similarImagesData as Image[]);
        } catch (err) {
          console.error('Failed to fetch image matches', err);
          // Continue without matches if they fail to load
          setMatches([]);
          setSimilarImages([]);
        }
        
        // Get remaining count in queue
        try {
          const statsData = await QueueAPI.getQueueStats();
          
          if (statsData && statsData.length > 0) {
            setRemainingCount(statsData[0].pending || 0);
          }
        } catch (err) {
          console.error('Failed to fetch queue stats', err);
          // Continue without updating remaining count
        }
      } else {
        // No tasks returned or invalid task data
        setSimilarImages([]);
        setCurrentTask(null);
        setCurrentImage(null);
        setMatches([]);
        throw new Error('No more tasks available in the queue');
      }
    } catch (err) {
      console.error('Error in fetchNextTask', err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to fetch the next review task. Please try again.');
      } else {
        setError('Failed to fetch the next review task. Please try again.');
      }
      
      // For development, use mock data if API fails
      useMockData();
    } finally {
      setLoading(false);
    }
  }, [config]);

  // Fetch initial data
  useEffect(() => {
    // Start with loading state
    setLoading(true);
    
    // Just use mock data - keep it simple
    useMockData();
    
    // Set loading to false
    setLoading(false);
    
  }, []);

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
      
      // For development/testing - just show success toast and load next mock data
      toast({
        title: 'Review Submitted',
        description: `Content was ${result}. ${notes ? `Notes: ${notes}` : ''}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // In a real implementation, we would call the API to update the task status
      try {
        // If this is a real task with an ID (not mock data), call the API
        if (currentTask.id && typeof currentTask.id === 'string' && !currentTask.id.startsWith('mock')) {
          await QueueAPI.completeTask(currentTask.id, result, notes);
          // After completing the task, fetch the next one
          await fetchNextTask();
        } else {
          // For mock data, just load the next mock item
          useMockData();
        }
      } catch (err) {
        console.error('Error completing task:', err);
        // If API call fails, fallback to mock data
        useMockData();
      }
            
      setSubmitting(false);
      
    } catch (err) {
      console.error('Failed to complete review', err);
      setError('Failed to submit your review. Please try again.');
      setSubmitting(false);
    }
  };
  
  // Use mock data for development
  const useMockData = () => {
    // Mock task
    setCurrentTask({
      id: 'mock-task-123',
      image_id: 1,
      content_category: 'fowl_play',
      hash_algorithm: 'pdq',
      confidence_level: 'high',
      is_escalated: false,
      status: 'pending',
      created_at: new Date().toISOString(),
      metadata: {
        source: 'Source 1',
        reporter: 'User',
        report_reason: 'Reason 1'
      }
    });
    
    // Mock image
    setCurrentImage({
      id: 1,
      filename: 'test_image.jpg',
      upload_date: new Date().toISOString(),
      url: '/test_images/photo8.jpg', // Local test image
      size: 12345,
      width: 800,
      height: 600,
      mime_type: 'image/jpeg',
      hashes: [
        {
          algorithm: 'pdq',
          hash: 'f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6',
          quality: 90
        }
      ]
    });
    
    // Mock matches
    setMatches([
      {
        match_id: 'm1',
        hash_algorithm: 'pdq',
        match_hash: 'f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6',
        distance: 5,
        reference_id: 'ref123',
        reference_source: 'internal database',
        reference_type: 'known_content',
        reference_metadata: {
          category: 'hate_speech',
          severity: 'high',
          added_date: new Date().toISOString()
        }
      }
    ]);
    
    // Mock similar images - ensure all have proper test image paths
    setSimilarImages([
      {
        id: 2,
        filename: 'similar_1.jpg',
        upload_date: new Date().toISOString(),
        url: '/test_images/photo9.jpg', // Local test image
        size: 10000,
        width: 400,
        height: 300,
        mime_type: 'image/jpeg',
        hashes: [
          {
            algorithm: 'pdq',
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
        size: 9500,
        width: 400,
        height: 300,
        mime_type: 'image/jpeg',
        hashes: [
          {
            algorithm: 'pdq',
            hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
            quality: 88
          }
        ]
      }
    ]);
    
    // Show a toast message to inform the user we're using mock data
    toast({
      title: 'Using Demo Data',
      description: 'API data unavailable. Using demo images instead.',
      status: 'info',
      duration: 4000,
      isClosable: true,
    });
  };
  
  // Handle review actions
  const handleApprove = (id: number, notes: string) => {
    completeReview('approved', notes);
    // Next task is automatically loaded by useMockData in completeReview
  };
  
  const handleReject = (id: number, notes: string) => {
    completeReview('rejected', notes);
    // Next task is automatically loaded by useMockData in completeReview
  };
  
  const handleEscalate = (id: number, notes: string) => {
    completeReview('escalated', notes);
    // Next task is automatically loaded by useMockData in completeReview
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
      
      // Load next task
      fetchNextTask();
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
            {remainingCount > 0 && ` ${remainingCount} items remaining.`}
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
            colorScheme="blue" 
            onClick={() => fetchNextTask()} 
            isLoading={loading || submitting}
            size="sm"
          >
            Skip
          </Button>
        </HStack>
      </Flex>
      
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
            <Card borderColor={borderColor} boxShadow="sm" mb={6}>
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
                />
              </CardBody>
            </Card>
            
            <Card borderColor={borderColor} boxShadow="sm">
              <CardHeader bg={headerBg} py={3}>
                <Flex justifyContent="space-between" alignItems="center">
                  <Heading size="md">Match Information</Heading>
                  <Tooltip label="This content was flagged because it matched entries in a database of known content">
                    <span><InfoIcon /></span>
                  </Tooltip>
                </Flex>
              </CardHeader>
              <CardBody>
                <MatchDetails matches={matches} />
                
                {similarImages.length > 0 && (
                  <Box mt={6}>
                    <Heading size="sm" mb={3}>Similar Content</Heading>
                    <Grid templateColumns="repeat(auto-fill, minmax(180px, 1fr))" gap={3}>
                      {similarImages.map((image) => (
                        <Box key={image.id}>
                          <ImageCard image={image} isCompact />
                        </Box>
                      ))}
                    </Grid>
                  </Box>
                )}
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      )}
      
      {/* No Content State */}
      {!loading && !currentTask && (
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
    </AppLayout>
  );
} 