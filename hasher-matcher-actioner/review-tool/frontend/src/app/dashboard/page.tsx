'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Flex,
  Select,
  HStack,
  Text,
  useColorModeValue,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Button,
  useToast,
} from '@chakra-ui/react';
import AppLayout from '../components/layout/AppLayout';
import { QueueCard } from '../components/dashboard/QueueCard';
import { FilterBar } from '../components/dashboard/FilterBar';
import { StatsOverview } from '../components/dashboard/StatsOverview';
import { QueueAPI } from '../services/api';
import { QueueStats, QueueConfig } from '../types/queue';

const Dashboard = () => {
  const [stats, setStats] = useState<QueueStats[]>([]);
  const [config, setConfig] = useState<QueueConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedHashAlgorithm, setSelectedHashAlgorithm] = useState<string>('');
  const [selectedConfidenceLevel, setSelectedConfidenceLevel] = useState<string>('');
  const [showEscalated, setShowEscalated] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('oldest');

  // Function to fetch dashboard data from the API
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // In production, use the real API:
      const statsParams: any = {};
      if (selectedCategory) statsParams.contentCategory = selectedCategory;
      if (selectedHashAlgorithm) statsParams.hashAlgorithm = selectedHashAlgorithm;
      statsParams.isEscalated = showEscalated;

      const [statsData, configData] = await Promise.all([
        QueueAPI.getQueueStats(statsParams),
        QueueAPI.getQueueConfig()
      ]);
      
      setStats(statsData);
      setConfig(configData);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      setError('Failed to load dashboard data. Please try again later.');
      
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      // For development/demo fallback: use mock data when API fails
      useMockData();
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedHashAlgorithm, showEscalated, toast]);

  // Function to use mock data for development/demo
  const useMockData = () => {
    const mockCategories = ['adult', 'violence', 'hate_speech', 'terrorism', 'self_harm', 'spam', 'other'];
    const mockHashTypes = ['pdq', 'md5', 'sha1', 'escalated', 'manual'];
    const mockConfidenceLevels = ['high', 'medium', 'low'];
    
    const mockStats: QueueStats[] = [];
    
    // Generate mock data for each category and hash type
    mockCategories.forEach(category => {
      mockHashTypes.forEach(hash => {
        // Skip escalated for normal queues
        if (hash === 'escalated' && !showEscalated) return;
        
        const isEsc = hash === 'escalated';
        mockStats.push({
          queueName: `review:${hash}:${category}${isEsc ? '_escalated' : ''}`,
          contentCategory: category,
          hashAlgorithm: hash,
          isEscalated: isEsc,
          pending: Math.floor(Math.random() * 50),
          active: Math.floor(Math.random() * 10),
          completed: Math.floor(Math.random() * 100) + 50,
          successRate: Math.random() * 100,
          oldestTaskAge: Math.floor(Math.random() * 86400) // Random seconds up to a day
        });
      });
    });
    
    setStats(mockStats);
    setConfig({
      hashAlgorithms: mockHashTypes,
      contentCategories: mockCategories,
      confidenceLevels: mockConfidenceLevels
    });
    
    toast({
      title: 'Using Demo Data',
      description: 'API data unavailable. Using local test images and mock data instead.',
      status: 'info',
      duration: 4000,
      isClosable: true,
    });
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Function to handle refresh button click
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Filter and sort the stats
  const filteredStats = stats.filter(queue => {
    if (selectedCategory && queue.contentCategory !== selectedCategory) return false;
    if (selectedHashAlgorithm && queue.hashAlgorithm !== selectedHashAlgorithm) return false;
    if (showEscalated !== queue.isEscalated) return false;
    return true;
  });

  // Sort the filtered stats
  const sortedStats = [...filteredStats].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return b.oldestTaskAge - a.oldestTaskAge;
      case 'pending':
        return b.pending - a.pending;
      case 'success':
        return b.successRate - a.successRate;
      default:
        return 0;
    }
  });

  // Calculate aggregated statistics
  const totalPending = filteredStats.reduce((sum, queue) => sum + queue.pending, 0);
  const totalActive = filteredStats.reduce((sum, queue) => sum + queue.active, 0);
  const totalCompleted = filteredStats.reduce((sum, queue) => sum + queue.completed, 0);
  const avgSuccessRate = filteredStats.length > 0
    ? filteredStats.reduce((sum, queue) => sum + queue.successRate, 0) / filteredStats.length
    : 0;
  const oldestTask = filteredStats.length > 0
    ? Math.max(...filteredStats.map(queue => queue.oldestTaskAge))
    : 0;

  // Format time duration
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
  };

  // UI states
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const tabBg = useColorModeValue('white', 'gray.800');

  if (loading) {
    return (
      <AppLayout>
        <Center minHeight="500px">
          <Spinner size="xl" />
        </Center>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Box p={4} bg={bgColor} minH="calc(100vh - 100px)">
        <Flex justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Heading size="xl">Moderation Dashboard</Heading>
            <Text color="gray.600" mt={1} mb={4}>
              Moderation queues allow you to manually review content and users one at a time
            </Text>
          </Box>
          <Button 
            colorScheme="purple" 
            size="md"
            borderRadius="md"
          >
            Create Queue
          </Button>
        </Flex>
        
        {error && (
          <Alert status="error" mb={6}>
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        {/* Stats Overview */}
        <StatsOverview 
          totalPending={totalPending}
          totalActive={totalActive}
          totalCompleted={totalCompleted}
          avgSuccessRate={avgSuccessRate}
          oldestTask={oldestTask}
          formatDuration={formatDuration}
        />
        
        {/* Filters */}
        <Flex justify="flex-end" mb={4}>
          <Button 
            leftIcon={<span>🔄</span>}
            colorScheme="blue" 
            variant="outline"
            size="sm"
            onClick={handleRefresh} 
            isLoading={loading}
            mr={2}
          >
            Refresh
          </Button>
          <Button
            leftIcon={<span>🔍</span>}
            colorScheme="gray"
            variant="outline"
            size="sm"
          >
            Filter
          </Button>
        </Flex>
        
        {/* Queue Table */}
        <Box 
          borderWidth="1px" 
          borderRadius="lg" 
          overflow="hidden" 
          bg="white" 
          boxShadow="sm"
        >
          <Box as="table" width="100%" style={{ borderCollapse: 'collapse' }}>
            <Box as="thead" bg="gray.50">
              <Box as="tr">
                <Box as="th" p={4} textAlign="left" fontWeight="semibold" width="5%"></Box>
                <Box as="th" p={4} textAlign="left" fontWeight="semibold" width="25%">Name</Box>
                <Box as="th" p={4} textAlign="left" fontWeight="semibold" width="30%">Description</Box>
                <Box as="th" p={4} textAlign="left" fontWeight="semibold" width="10%">Pending Jobs</Box>
                <Box as="th" p={4} textAlign="center" colSpan={3} width="30%">Actions</Box>
              </Box>
            </Box>
            <Box as="tbody">
              {loading ? (
                <Box as="tr">
                  <Box as="td" colSpan={6} p={8} textAlign="center">
                    <Spinner size="lg" />
                  </Box>
                </Box>
              ) : sortedStats.length > 0 ? (
                sortedStats.map((queue) => (
                  <Box as="tr" key={queue.queueName} borderTopWidth="1px" _hover={{ bg: "gray.50" }}>
                    <Box as="td" p={4} textAlign="center">
                      <Text fontSize="xl" color="yellow.400">☆</Text>
                    </Box>
                    <Box as="td" p={4}>
                      <Text fontWeight="semibold">
                        {queue.contentCategory.charAt(0).toUpperCase() + queue.contentCategory.slice(1)} - {queue.hashAlgorithm.toUpperCase()}
                        {queue.isEscalated && " (Escalated)"}
                      </Text>
                    </Box>
                    <Box as="td" p={4}>
                      <Text>
                        {queue.contentCategory.charAt(0).toUpperCase() + queue.contentCategory.slice(1)} content 
                        {queue.isEscalated ? ' escalated' : ' flagged'} for review via {queue.hashAlgorithm.toUpperCase()} matching
                      </Text>
                    </Box>
                    <Box as="td" p={4}>
                      <Text fontWeight="semibold">{queue.pending}</Text>
                    </Box>
                    <Box as="td" p={3} textAlign="center">
                      <Button 
                        colorScheme="blue" 
                        size="sm"
                        onClick={() => {
                          // Parse the queue name to extract category, algorithm, etc.
                          const parts = queue.queueName.split(':');
                          const algorithm = parts[1] || '';
                          const category = parts[2] || '';
                          
                          // Build query params
                          const params = new URLSearchParams();
                          if (category) params.append('category', category);
                          if (algorithm) params.append('algorithm', algorithm);
                          if (queue.isEscalated) params.append('escalated', 'true');
                          
                          // Navigate to review page
                          window.location.href = `/review?${params.toString()}`;
                        }}
                      >
                        Start Reviewing
                      </Button>
                    </Box>
                    <Box as="td" p={3} textAlign="center">
                      <Button size="sm" variant="outline">Delete All Jobs</Button>
                    </Box>
                    <Box as="td" p={3} textAlign="center">
                      <Button size="sm" variant="outline">Preview jobs</Button>
                    </Box>
                  </Box>
                ))
              ) : (
                <Box as="tr">
                  <Box as="td" colSpan={6} p={8} textAlign="center">
                    <Text>No queues available with the current filters. Try changing your filters or refreshing.</Text>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </AppLayout>
  );
};

export default Dashboard; 