'use client';

import React, { useState, useEffect } from 'react';
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
  Badge,
} from '@chakra-ui/react';
import AppLayout from '../components/layout/AppLayout';
import { QueueCard } from '../components/dashboard/QueueCard';
import { FilterBar } from '../components/dashboard/FilterBar';
import { StatsOverview } from '../components/dashboard/StatsOverview';

// Types
interface QueueStats {
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

interface QueueConfig {
  hashAlgorithms: string[];
  contentCategories: string[];
  confidenceLevels: string[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<QueueStats[]>([]);
  const [config, setConfig] = useState<QueueConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedHashAlgorithm, setSelectedHashAlgorithm] = useState<string>('');
  const [selectedConfidenceLevel, setSelectedConfidenceLevel] = useState<string>('');
  const [showEscalated, setShowEscalated] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('oldest');

  useEffect(() => {
    // Mock data for development - replace with actual API calls
    const mockCategories = ['adult', 'violence', 'hate_speech', 'terrorism', 'self_harm', 'spam', 'other'];
    const mockHashTypes = ['pdq', 'md5', 'sha1', 'escalated', 'manual'];
    const mockConfidenceLevels = ['high', 'medium', 'low'];
    
    const mockStats: QueueStats[] = [];
    
    // Generate mock data for each category and hash type
    mockCategories.forEach(category => {
      mockHashTypes.forEach(hash => {
        // Skip escalated for normal queues
        if (hash === 'escalated' && !showEscalated) continue;
        
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
    setLoading(false);
    
    // In production, replace with:
    // const fetchData = async () => {
    //   try {
    //     setLoading(true);
    //     const [statsResponse, configResponse] = await Promise.all([
    //       fetch('/api/queues/stats'),
    //       fetch('/api/queues/config')
    //     ]);
    //     
    //     if (!statsResponse.ok || !configResponse.ok) {
    //       throw new Error('Failed to fetch queue data');
    //     }
    //     
    //     const statsData = await statsResponse.json();
    //     const configData = await configResponse.json();
    //     
    //     setStats(statsData);
    //     setConfig(configData);
    //   } catch (err) {
    //     setError('Failed to load dashboard data');
    //     console.error(err);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // 
    // fetchData();
  }, [showEscalated]); // Re-fetch when escalated filter changes

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

  if (error) {
    return (
      <AppLayout>
        <Alert status="error" my={4}>
          <AlertIcon />
          {error}
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Box p={4} bg={bgColor} minH="calc(100vh - 100px)">
        <Heading mb={6}>Review Queues Dashboard</Heading>
        
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
        <FilterBar
          categories={config?.contentCategories || []}
          hashAlgorithms={config?.hashAlgorithms || []}
          confidenceLevels={config?.confidenceLevels || []}
          selectedCategory={selectedCategory}
          selectedHashAlgorithm={selectedHashAlgorithm}
          selectedConfidenceLevel={selectedConfidenceLevel}
          showEscalated={showEscalated}
          sortBy={sortBy}
          onCategoryChange={setSelectedCategory}
          onHashAlgorithmChange={setSelectedHashAlgorithm}
          onConfidenceLevelChange={setSelectedConfidenceLevel}
          onEscalatedChange={setShowEscalated}
          onSortByChange={setSortBy}
        />
        
        {/* Content Tabs */}
        <Tabs variant="enclosed" mt={6} bg={tabBg} borderRadius="md" boxShadow="base">
          <TabList>
            <Tab>All Categories</Tab>
            {config?.contentCategories.map(category => (
              <Tab key={category} onClick={() => setSelectedCategory(category)}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Tab>
            ))}
          </TabList>

          <TabPanels>
            {/* All Categories Panel */}
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {sortedStats.map((queue) => (
                  <QueueCard
                    key={queue.queueName}
                    queue={queue}
                    formatDuration={formatDuration}
                  />
                ))}
              </SimpleGrid>
            </TabPanel>
            
            {/* Category-specific Panels */}
            {config?.contentCategories.map(category => (
              <TabPanel key={category}>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {sortedStats
                    .filter(q => q.contentCategory === category)
                    .map((queue) => (
                      <QueueCard
                        key={queue.queueName}
                        queue={queue}
                        formatDuration={formatDuration}
                      />
                    ))
                  }
                </SimpleGrid>
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </Box>
    </AppLayout>
  );
};

export default Dashboard; 