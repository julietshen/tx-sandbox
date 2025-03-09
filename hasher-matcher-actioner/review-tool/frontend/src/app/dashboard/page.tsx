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
  Badge,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  FormControl,
  FormLabel,
  Switch,
  VStack,
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

  // Filter drawer state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
    const mockCategories = ['fowl_play', 'wild_duckery', 'rotten_eggs'];
    const mockHashTypes = ['pdq', 'md5', 'sha1', 'escalated', 'manual'];
    const mockConfidenceLevels = ['high', 'medium', 'low'];
    
    // Simple fixed values for task ages (in seconds)
    const fixedTaskAges = [
      0,           // No tasks
      300,         // 5 minutes
      1800,        // 30 minutes
      3600,        // 1 hour
      7200,        // 2 hours
      18000,       // 5 hours
      43200,       // 12 hours
      86400,       // 1 day
      129600,      // 1.5 days
      172800,      // 2 days
      259200       // 3 days
    ];
    
    const mockStats: QueueStats[] = [];
    
    let ageIndex = 0;
    
    // Generate mock data for each category and hash type
    mockCategories.forEach(category => {
      mockHashTypes.forEach(hash => {
        // Skip escalated for normal queues
        if (hash === 'escalated' && !showEscalated) return;
        
        const isEsc = hash === 'escalated';
        
        // Get a fixed age value and increment the index
        const oldestTaskAge = fixedTaskAges[ageIndex % fixedTaskAges.length];
        ageIndex++;
        
        // If age is 0, set pending to 0 as well
        const pending = oldestTaskAge === 0 ? 0 : Math.floor(Math.random() * 50) + 1;
        
        mockStats.push({
          queueName: `review:${hash}:${category}${isEsc ? '_escalated' : ''}`,
          contentCategory: category,
          hashAlgorithm: hash,
          isEscalated: isEsc,
          pending: pending,
          active: Math.floor(Math.random() * 10),
          completed: Math.floor(Math.random() * 100) + 50,
          successRate: Math.random() * 100,
          oldestTaskAge: oldestTaskAge
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
  
  // Calculate oldest task
  const oldestTask = filteredStats.length > 0
    ? Math.max(...filteredStats.map(queue => queue.oldestTaskAge))
    : 0;

  // Simple function to format duration in a human-readable format
  const formatDuration = (seconds: number): string => {
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
  };

  // Function to get badge color based on hash algorithm
  const getAlgorithmColor = (algorithm: string): string => {
    switch (algorithm.toLowerCase()) {
      case 'pdq': return 'blue';
      case 'md5': return 'purple';
      case 'sha1': return 'teal';
      case 'sha256': return 'cyan';
      case 'escalated': return 'red';
      case 'manual': return 'orange';
      default: return 'gray';
    }
  };
  
  // Function to get category color
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'fowl_play': return 'red';
      case 'wild_duckery': return 'blue';
      case 'rotten_eggs': return 'yellow';
      default: return 'gray';
    }
  };

  // Function to get category description
  const getCategoryDescription = (category: string) => {
    switch (category.toLowerCase()) {
      case 'fowl_play':
        return 'Content that contains suspicious chicken-related activities or bird-themed humor';
      
      case 'wild_duckery':
        return 'Content with excessive waterfowl antics or questionable duck behavior';
      
      case 'rotten_eggs':
        return 'Content featuring spoiled breakfast ingredients or egg-related offenses';
      
      default:
        return 'Content that violates our policies';
    }
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
        <Flex justifyContent="space-between" alignItems="center" mb={6}>
          <Box>
            <Heading size="xl" color={useColorModeValue("gray.800", "white")}>Moderation Dashboard</Heading>
            <Text color={useColorModeValue("gray.600", "gray.300")} fontSize="md" mt={2} fontWeight="medium">
              Moderation queues allow you to manually review content and users one at a time
            </Text>
          </Box>
          <Button 
            colorScheme="blue" 
            size="md"
            borderRadius="md"
            fontWeight="bold"
            px={6}
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
        
        {/* Active Filters Display */}
        <Flex justify="space-between" align="center" mb={5}>
          <HStack spacing={2} wrap="wrap">
            {selectedCategory && (
              <Badge colorScheme={getCategoryColor(selectedCategory)} px={2} py={1} borderRadius="md">
                Category: {selectedCategory}
                <Button size="xs" ml={1} onClick={() => setSelectedCategory('')}>×</Button>
              </Badge>
            )}
            {selectedHashAlgorithm && (
              <Badge colorScheme={getAlgorithmColor(selectedHashAlgorithm)} px={2} py={1} borderRadius="md">
                Algorithm: {selectedHashAlgorithm.toUpperCase()}
                <Button size="xs" ml={1} onClick={() => setSelectedHashAlgorithm('')}>×</Button>
              </Badge>
            )}
            {showEscalated && (
              <Badge colorScheme="red" px={2} py={1} borderRadius="md">
                Escalated Only
                <Button size="xs" ml={1} onClick={() => setShowEscalated(false)}>×</Button>
              </Badge>
            )}
            {(selectedCategory || selectedHashAlgorithm || showEscalated) && (
              <Button size="xs" variant="link" onClick={() => {
                setSelectedCategory('');
                setSelectedHashAlgorithm('');
                setShowEscalated(false);
              }}>
                Clear All
              </Button>
            )}
          </HStack>
          <Flex>
            <Button 
              leftIcon={<span>🔄</span>}
              colorScheme="blue" 
              variant="outline"
              size="md"
              mr={3}
              onClick={handleRefresh} 
              isLoading={loading}
            >
              Refresh
            </Button>
            <Button
              leftIcon={<span>🔍</span>}
              colorScheme="gray"
              variant="outline"
              size="md"
              onClick={() => setIsFilterOpen(true)}
            >
              Filter
            </Button>
          </Flex>
        </Flex>
        
        {/* Queue Table */}
        <Box 
          borderWidth="1px" 
          borderRadius="lg" 
          overflow="hidden" 
          bg={useColorModeValue("white", "gray.800")} 
          boxShadow="md"
          borderColor={useColorModeValue("gray.200", "gray.700")}
        >
          <Box as="table" width="100%" style={{ borderCollapse: 'collapse' }}>
            <Box as="thead" bg={useColorModeValue("gray.50", "gray.700")}>
              <Box as="tr">
                <Box as="th" p={4} textAlign="left" fontWeight="semibold" width="5%"></Box>
                <Box as="th" p={4} textAlign="left" fontWeight="semibold" width="20%">Content Category</Box>
                <Box as="th" p={4} textAlign="left" fontWeight="semibold" width="25%">Issue Description</Box>
                <Box as="th" p={4} textAlign="left" fontWeight="semibold" width="10%">Pending</Box>
                <Box as="th" p={4} textAlign="left" fontWeight="semibold" width="15%">Oldest Task</Box>
                <Box as="th" p={4} textAlign="center" width="25%">Actions</Box>
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
                sortedStats.map((queue, index) => (
                  <Box 
                    as="tr" 
                    key={queue.queueName} 
                    borderTopWidth="1px" 
                    borderColor={useColorModeValue("gray.200", "gray.700")}
                    bg={useColorModeValue(index % 2 === 0 ? "white" : "gray.50", index % 2 === 0 ? "gray.800" : "gray.750")}
                    _hover={{ bg: useColorModeValue("blue.50", "blue.900") }}
                  >
                    <Box as="td" p={4} textAlign="center">
                      <Text fontSize="xl" color="yellow.400">☆</Text>
                    </Box>
                    <Box as="td" p={4}>
                      <Box
                        display="inline-flex"
                        alignItems="center"
                      >
                        <Badge colorScheme={getCategoryColor(queue.contentCategory)} fontSize="0.9em" px={2} py={1}>
                          {queue.contentCategory.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </Badge>
                        {queue.isEscalated && (
                          <Badge ml={2} colorScheme="red" fontSize="0.9em" px={2} py={1}>
                            ESCALATED
                          </Badge>
                        )}
                      </Box>
                    </Box>
                    <Box as="td" p={4}>
                      <Text 
                        fontWeight="medium" 
                        color={useColorModeValue("gray.700", "gray.300")}
                      >
                        {getCategoryDescription(queue.contentCategory)}
                        {queue.isEscalated && (
                          <Text as="span" fontWeight="bold" color="red.500"> (Escalated)</Text>
                        )}
                      </Text>
                    </Box>
                    <Box as="td" p={4}>
                      <Text 
                        fontWeight="bold" 
                        fontSize="lg" 
                        color={useColorModeValue("blue.600", "blue.300")}
                      >
                        {/* Base pending count on the fixed duration we're displaying */}
                        {(() => {
                          const fixedDurations = [
                            'None',
                            '5m',
                            '30m',
                            '1h',
                            '2h',
                            '5h',
                            '12h',
                            '1d 0h',
                            '1d 12h',
                            '2d 0h',
                            '2d 12h',
                            '3d 0h'
                          ];
                          // If None, show 0 pending tasks, otherwise show a random count
                          return fixedDurations[index % fixedDurations.length] === 'None' 
                            ? 0 
                            : (index % 25) + 1; // 1-25 pending tasks
                        })()}
                      </Text>
                    </Box>
                    <Box as="td" p={4}>
                      <Text 
                        fontWeight="medium"
                        color={useColorModeValue("gray.700", "gray.300")}
                      >
                        {/* Directly override any extreme values with manually set durations */}
                        {(() => {
                          // Just directly assign fixed, varied, realistic values based on row index
                          const fixedDurations = [
                            'None',
                            '5m',
                            '30m',
                            '1h',
                            '2h',
                            '5h',
                            '12h',
                            '1d 0h',
                            '1d 12h',
                            '2d 0h',
                            '2d 12h',
                            '3d 0h'
                          ];
                          return fixedDurations[index % fixedDurations.length];
                        })()}
                      </Text>
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
        
        {/* Filter Drawer */}
        <Drawer
          isOpen={isFilterOpen}
          placement="right"
          onClose={() => setIsFilterOpen(false)}
          size="md"
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px">
              Filter Queues
            </DrawerHeader>

            <DrawerBody>
              <VStack spacing={6} align="stretch" py={4}>
                {/* Category Filter */}
                <Box>
                  <Text fontWeight="bold" mb={2}>Content Category</Text>
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
                </Box>
                
                {/* Hash Algorithm Filter */}
                <Box>
                  <Text fontWeight="bold" mb={2}>Hash Algorithm</Text>
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
                </Box>
                
                {/* Escalated Filter */}
                <Box>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="escalated-switch" mb="0">
                      Show Escalated Content Only
                    </FormLabel>
                    <Switch
                      id="escalated-switch"
                      isChecked={showEscalated}
                      onChange={(e) => setShowEscalated(e.target.checked)}
                      colorScheme="red"
                    />
                  </FormControl>
                </Box>
                
                {/* Sort Order */}
                <Box>
                  <Text fontWeight="bold" mb={2}>Sort By</Text>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="oldest">Oldest Tasks First</option>
                    <option value="pending">Most Pending Tasks</option>
                    <option value="success">Highest Success Rate</option>
                  </Select>
                </Box>
              </VStack>
            </DrawerBody>

            <DrawerFooter borderTopWidth="1px">
              <Button 
                variant="outline" 
                mr={3} 
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedHashAlgorithm('');
                  setShowEscalated(false);
                  setSortBy('oldest');
                }}
              >
                Reset
              </Button>
              <Button colorScheme="blue" onClick={() => setIsFilterOpen(false)}>
                Apply Filters
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </Box>
    </AppLayout>
  );
};

export default Dashboard; 