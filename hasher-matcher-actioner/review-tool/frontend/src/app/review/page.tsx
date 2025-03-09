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
  Flex,
  useToast,
  Center,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Select,
  useColorModeValue,
} from '@chakra-ui/react';
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
  
  // Task data
  const [currentTask, setCurrentTask] = useState<QueueTask | null>(null);
  const [currentImage, setCurrentImage] = useState<Image | null>(null);
  const [similarImages, setSimilarImages] = useState<Image[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  
  // Filter state
  const [config, setConfig] = useState<QueueConfig | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedHashAlgorithm, setSelectedHashAlgorithm] = useState<string>('');
  const [selectedConfidenceLevel, setSelectedConfidenceLevel] = useState<string>('');
  const [showEscalated, setShowEscalated] = useState<boolean>(false);

  // Get next task based on current filters
  const fetchNextTask = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build fetch parameters from filters
      const fetchParams: any = {};
      if (selectedCategory) fetchParams.contentCategories = [selectedCategory];
      if (selectedHashAlgorithm) fetchParams.hashAlgorithms = [selectedHashAlgorithm];
      if (selectedConfidenceLevel) fetchParams.confidenceLevels = [selectedConfidenceLevel];
      if (showEscalated) fetchParams.isEscalated = true;
      
      const [nextTask, configData] = await Promise.all([
        QueueAPI.getNextTask(fetchParams),
        QueueAPI.getQueueConfig()
      ]);
      
      setConfig(configData);
      
      if (!nextTask) {
        setCurrentTask(null);
        setCurrentImage(null);
        setMatches([]);
        setSimilarImages([]);
        setLoading(false);
        return;
      }
      
      setCurrentTask(nextTask as QueueTask);
      
      // Fetch image data for the task
      const imageId = (nextTask as QueueTask).imageId;
      const [imageData, matchesData] = await Promise.all([
        ImageAPI.getImage(imageId),
        ImageAPI.getImageMatches(imageId)
      ]);
      
      setCurrentImage(imageData as Image);
      setMatches(matchesData as Match[]);
      
      // If there are matches, fetch similar images
      if (matchesData.length > 0) {
        const similarImageIds = (matchesData as Match[]).map(match => match.matched_image_id);
        const similarImagesPromises = similarImageIds.slice(0, 5).map(id => ImageAPI.getImage(id));
        const similarImagesData = await Promise.all(similarImagesPromises);
        setSimilarImages(similarImagesData as Image[]);
      } else {
        setSimilarImages([]);
      }
    } catch (err) {
      console.error('Failed to fetch next task', err);
      setError('Failed to fetch the next review task. Please try again.');
      
      // For development, use mock data if API fails
      useMockData();
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedHashAlgorithm, selectedConfidenceLevel, showEscalated]);

  // Fetch initial data
  useEffect(() => {
    // Parse search params to set initial filters
    const category = searchParams.get('category');
    const algorithm = searchParams.get('algorithm');
    const confidence = searchParams.get('confidence');
    const escalated = searchParams.get('escalated') === 'true';
    
    if (category) setSelectedCategory(category);
    if (algorithm) setSelectedHashAlgorithm(algorithm);
    if (confidence) setSelectedConfidenceLevel(confidence);
    if (escalated) setShowEscalated(true);
    
    fetchNextTask();
  }, [fetchNextTask, searchParams]);

  // Handle review action completion
  const completeReview = async (
    result: 'approved' | 'rejected' | 'escalated',
    notes?: string
  ) => {
    if (!currentTask) return;
    
    try {
      setProcessing(true);
      
      await QueueAPI.completeTask(currentTask.id, result, notes);
      
      toast({
        title: 'Review Submitted',
        description: `The image has been ${result}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Wait a moment before loading the next task
      setTimeout(() => {
        fetchNextTask();
      }, 1000);
    } catch (err) {
      console.error('Failed to complete review', err);
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessing(false);
    }
  };

  // Mock data for development/testing
  const useMockData = () => {
    // Mock image
    const mockImage: Image = {
      id: 1,
      filename: 'test_image.jpg',
      upload_date: new Date().toISOString(),
      url: 'https://via.placeholder.com/800x600',
      hashes: [
        { algorithm: 'pdq', hash: '0a1b2c3d4e5f6789', quality: 92 },
        { algorithm: 'md5', hash: 'a1b2c3d4e5f67890' }
      ]
    };
    
    // Mock matches
    const mockMatches: Match[] = [
      {
        id: 101,
        algorithm: 'pdq',
        distance: 0.12,
        match_date: new Date().toISOString(),
        matched_image_id: 2,
        matched_image_filename: 'similar_image_1.jpg'
      },
      {
        id: 102,
        algorithm: 'pdq',
        distance: 0.18,
        match_date: new Date().toISOString(),
        matched_image_id: 3,
        matched_image_filename: 'similar_image_2.jpg'
      }
    ];
    
    // Mock task
    const mockTask: QueueTask = {
      id: 'task_123',
      imageId: 1,
      contentCategory: 'adult',
      hashAlgorithm: 'pdq',
      confidenceLevel: 'high',
      isEscalated: false,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    // Mock similar images
    const mockSimilarImages: Image[] = [
      {
        id: 2,
        filename: 'similar_image_1.jpg',
        upload_date: new Date().toISOString(),
        url: 'https://via.placeholder.com/800x600?text=Similar1',
        hashes: [{ algorithm: 'pdq', hash: '1a2b3c4d5e6f7890' }]
      },
      {
        id: 3,
        filename: 'similar_image_2.jpg',
        upload_date: new Date().toISOString(),
        url: 'https://via.placeholder.com/800x600?text=Similar2',
        hashes: [{ algorithm: 'pdq', hash: '2a3b4c5d6e7f8901' }]
      }
    ];
    
    setCurrentImage(mockImage);
    setMatches(mockMatches);
    setSimilarImages(mockSimilarImages);
    setCurrentTask(mockTask);
    
    // Mock config
    setConfig({
      hashAlgorithms: ['pdq', 'md5', 'sha1', 'escalated', 'manual'],
      contentCategories: ['adult', 'violence', 'hate_speech', 'terrorism', 'self_harm', 'spam', 'other'],
      confidenceLevels: ['high', 'medium', 'low']
    });
    
    toast({
      title: 'Using Demo Data',
      description: 'API connection failed. Using demo data instead.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  // Handle approve, reject, escalate and skip actions
  const handleApprove = (id: number, notes: string) => {
    completeReview('approved', notes);
  };

  const handleReject = (id: number, notes: string) => {
    completeReview('rejected', notes);
  };

  const handleEscalate = (id: number, notes: string) => {
    completeReview('escalated', notes);
  };

  const handleSkip = (id: number) => {
    // Just load the next task without completing the current one
    fetchNextTask();
  };

  // Handle filter changes
  const handleFilterChange = () => {
    // Update URL with filters
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedHashAlgorithm) params.set('algorithm', selectedHashAlgorithm);
    if (selectedConfidenceLevel) params.set('confidence', selectedConfidenceLevel);
    if (showEscalated) params.set('escalated', 'true');
    
    router.push(`/review?${params.toString()}`);
    
    // Fetch next task with new filters
    fetchNextTask();
  };

  // UI styles
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <Center minHeight="500px">
          <VStack spacing={4}>
            <Spinner size="xl" />
            <Text>Loading next review task...</Text>
          </VStack>
        </Center>
      </AppLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AppLayout>
        <Box p={4}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertTitle mr={2}>Error Loading Task</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button mt={4} colorScheme="blue" onClick={fetchNextTask}>
            Try Again
          </Button>
        </Box>
      </AppLayout>
    );
  }

  // No tasks available
  if (!currentTask || !currentImage) {
    return (
      <AppLayout>
        <Box p={4}>
          <Alert status="info" borderRadius="md" mb={6}>
            <AlertIcon />
            <AlertTitle mr={2}>No Tasks Available</AlertTitle>
            <AlertDescription>
              There are no pending review tasks matching your current filters.
            </AlertDescription>
          </Alert>
          
          {/* Filter Panel */}
          <Box
            p={4}
            bg={cardBg}
            borderRadius="md"
            borderWidth="1px"
            borderColor={borderColor}
            mb={6}
          >
            <Heading size="md" mb={4}>Review Filters</Heading>
            <Grid templateColumns="repeat(12, 1fr)" gap={4}>
              <GridItem colSpan={{ base: 12, md: 3 }}>
                <Text mb={2} fontWeight="medium">Content Category</Text>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  placeholder="All Categories"
                >
                  {config?.contentCategories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </Select>
              </GridItem>
              
              <GridItem colSpan={{ base: 12, md: 3 }}>
                <Text mb={2} fontWeight="medium">Hash Algorithm</Text>
                <Select
                  value={selectedHashAlgorithm}
                  onChange={(e) => setSelectedHashAlgorithm(e.target.value)}
                  placeholder="All Algorithms"
                >
                  {config?.hashAlgorithms.map(algorithm => (
                    <option key={algorithm} value={algorithm}>
                      {algorithm.toUpperCase()}
                    </option>
                  ))}
                </Select>
              </GridItem>
              
              <GridItem colSpan={{ base: 12, md: 3 }}>
                <Text mb={2} fontWeight="medium">Confidence Level</Text>
                <Select
                  value={selectedConfidenceLevel}
                  onChange={(e) => setSelectedConfidenceLevel(e.target.value)}
                  placeholder="All Confidence Levels"
                >
                  {config?.confidenceLevels.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </Select>
              </GridItem>
              
              <GridItem colSpan={{ base: 12, md: 3 }}>
                <Flex height="100%" alignItems="flex-end">
                  <Button
                    colorScheme="blue"
                    onClick={handleFilterChange}
                    width="full"
                  >
                    Apply Filters
                  </Button>
                </Flex>
              </GridItem>
            </Grid>
          </Box>
          
          <Button
            colorScheme="blue"
            onClick={() => {
              // Clear all filters
              setSelectedCategory('');
              setSelectedHashAlgorithm('');
              setSelectedConfidenceLevel('');
              setShowEscalated(false);
              
              // Update URL and fetch
              router.push('/review');
              fetchNextTask();
            }}
          >
            Clear Filters & Try Again
          </Button>
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Grid
        templateColumns="repeat(12, 1fr)"
        gap={6}
        p={4}
      >
        {/* Main Content */}
        <GridItem colSpan={{ base: 12, lg: 8 }}>
          <VStack spacing={6} align="stretch">
            {/* Current Image */}
            <Box
              bg={cardBg}
              p={4}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Heading size="md" mb={4}>Review Item</Heading>
              <ImageCard 
                image={currentImage} 
                selectedAlgorithm={currentTask.hashAlgorithm}
              />
            </Box>
            
            {/* Review Actions */}
            <Box
              bg={cardBg}
              p={4}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Heading size="md" mb={4}>Review Decision</Heading>
              <ReviewActions 
                imageId={currentImage.id}
                onApprove={handleApprove}
                onReject={handleReject}
                onEscalate={handleEscalate}
                onSkip={handleSkip}
                isProcessing={processing}
              />
            </Box>
          </VStack>
        </GridItem>
        
        {/* Sidebar */}
        <GridItem colSpan={{ base: 12, lg: 4 }}>
          <VStack spacing={6} align="stretch">
            {/* Task Details */}
            <Box
              bg={cardBg}
              p={4}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Heading size="md" mb={4}>Task Details</Heading>
              <VStack spacing={2} align="stretch">
                <Flex justify="space-between">
                  <Text fontWeight="medium">Category:</Text>
                  <Text>{currentTask.contentCategory}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="medium">Algorithm:</Text>
                  <Text>{currentTask.hashAlgorithm.toUpperCase()}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="medium">Confidence:</Text>
                  <Text>{currentTask.confidenceLevel}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="medium">Status:</Text>
                  <Text>{currentTask.isEscalated ? 'Escalated' : 'Regular'}</Text>
                </Flex>
              </VStack>
            </Box>
            
            {/* Similar Images */}
            <Box
              bg={cardBg}
              p={4}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Heading size="md" mb={4}>Similar Images</Heading>
              {similarImages.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {similarImages.map(image => (
                    <Box key={image.id} onClick={() => {
                      // In the future, implement a view to see the similar image details
                      toast({
                        title: 'Image Details',
                        description: `Viewing details for ${image.filename}`,
                        status: 'info',
                        duration: 2000,
                      });
                    }}>
                      <ImageCard image={image} isCompact />
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Text>No similar images found.</Text>
              )}
            </Box>
            
            {/* Match Details */}
            <Box
              bg={cardBg}
              p={4}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Heading size="md" mb={4}>Hash Matches</Heading>
              <MatchDetails matches={matches} />
            </Box>
          </VStack>
        </GridItem>
      </Grid>
    </AppLayout>
  );
} 