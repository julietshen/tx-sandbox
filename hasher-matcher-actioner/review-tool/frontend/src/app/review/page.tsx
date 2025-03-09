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
  
  // Filter state
  const [config, setConfig] = useState<QueueConfig | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedHashAlgorithm, setSelectedHashAlgorithm] = useState<string>('');
  const [selectedConfidenceLevel, setSelectedConfidenceLevel] = useState<string>('');
  const [showEscalated, setShowEscalated] = useState<boolean>(false);
  
  // Get queue name for display
  const getQueueDisplayName = () => {
    if (selectedCategory && selectedHashAlgorithm) {
      const category = selectedCategory.split('_').map(
        word => word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      const algorithm = selectedHashAlgorithm.toUpperCase();
      
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
        const configData = await QueueAPI.getQueueConfig();
        setConfig(configData);
      }
      
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
      
      if (taskData) {
        setCurrentTask(taskData);
        
        // Fetch image details
        const imageData = await ImageAPI.getImage(taskData.image_id);
        setCurrentImage(imageData);
        
        // Fetch image matches
        const matchesData = await ImageAPI.getImageMatches(taskData.image_id);
        setMatches(matchesData?.matches || []);
        
        // Fetch similar images
        const similarImagesData = matchesData?.similar_images || [];
        setSimilarImages(similarImagesData as Image[]);
        
        // Get remaining count in queue
        const statsData = await QueueAPI.getQueueStats({
          contentCategory: selectedCategory,
          hashAlgorithm: selectedHashAlgorithm,
          isEscalated: showEscalated
        });
        
        if (statsData && statsData.length > 0) {
          setRemainingCount(statsData[0].pending || 0);
        }
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
  }, [selectedCategory, selectedHashAlgorithm, selectedConfidenceLevel, showEscalated, config]);

  // Fetch initial data
  useEffect(() => {
    // Start with loading state
    setLoading(true);
    
    // Parse search params to set initial filters
    const category = searchParams.get('category');
    const algorithm = searchParams.get('algorithm');
    const confidence = searchParams.get('confidence');
    const escalated = searchParams.get('escalated') === 'true';
    
    if (category) setSelectedCategory(category);
    if (algorithm) setSelectedHashAlgorithm(algorithm);
    if (confidence) setSelectedConfidenceLevel(confidence);
    if (escalated) setShowEscalated(true);
    
    // Just use mock data - keep it simple
    useMockData();
    
    // Set loading to false
    setLoading(false);
    
  }, [searchParams]);

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
      
      // Load next mock item
      useMockData();
            
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
      content_category: selectedCategory || 'hate_speech',
      hash_algorithm: selectedHashAlgorithm || 'pdq',
      confidence_level: selectedConfidenceLevel || 'high',
      is_escalated: showEscalated,
      status: 'pending',
      created_at: new Date().toISOString(),
      metadata: {
        source: 'Mock Source',
        reporter: 'System',
        report_reason: 'Potentially violating content'
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
          algorithm: selectedHashAlgorithm || 'pdq',
          hash: 'f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6',
          quality: 90
        }
      ]
    });
    
    // Mock matches
    setMatches([
      {
        match_id: 'm1',
        hash_algorithm: selectedHashAlgorithm || 'pdq',
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
            algorithm: selectedHashAlgorithm || 'pdq',
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
            algorithm: selectedHashAlgorithm || 'pdq',
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
  };
  
  const handleReject = (id: number, notes: string) => {
    completeReview('rejected', notes);
  };
  
  const handleEscalate = (id: number, notes: string) => {
    completeReview('escalated', notes);
  };
  
  const handleSkip = (id: number) => {
    fetchNextTask();
  };
  
  // Handle filter changes
  const handleFilterChange = () => {
    // Update URL with new filters
    const params = new URLSearchParams();
    if (selectedCategory) params.append('category', selectedCategory);
    if (selectedHashAlgorithm) params.append('algorithm', selectedHashAlgorithm);
    if (selectedConfidenceLevel) params.append('confidence', selectedConfidenceLevel);
    if (showEscalated) params.append('escalated', 'true');
    
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?${params.toString()}`
    );
    
    // Fetch next task with new filters
    fetchNextTask();
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
          <Heading size="lg">Review: {getQueueDisplayName()}</Heading>
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
      
      {/* Filter Controls */}
      <Box mb={6} p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor} bg={cardBg}>
        <Flex gap={4} wrap={{ base: 'wrap', md: 'nowrap' }}>
          <Select
            placeholder="Content Category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={loading || submitting}
            size="sm"
          >
            {config?.contentCategories.map((category) => (
              <option key={category} value={category}>
                {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </option>
            ))}
          </Select>
          
          <Select
            placeholder="Hash Algorithm"
            value={selectedHashAlgorithm}
            onChange={(e) => setSelectedHashAlgorithm(e.target.value)}
            disabled={loading || submitting}
            size="sm"
          >
            {config?.hashAlgorithms.map((algo) => (
              <option key={algo} value={algo}>
                {algo.toUpperCase()}
              </option>
            ))}
          </Select>
          
          <Select
            placeholder="Confidence Level"
            value={selectedConfidenceLevel}
            onChange={(e) => setSelectedConfidenceLevel(e.target.value)}
            disabled={loading || submitting}
            size="sm"
          >
            {config?.confidenceLevels.map((level) => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </Select>
          
          <Button
            colorScheme="blue"
            onClick={handleFilterChange}
            isLoading={loading}
            size="sm"
          >
            Apply Filters
          </Button>
        </Flex>
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