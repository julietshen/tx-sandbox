'use client';

function getMockTasks(count = 10) {
  const categories = [
    'fowl_play',
    'wild_duckery',
    'rotten_eggs',
  ];
  
  const hashAlgorithms = ['pdq', 'md5', 'sha256'];
  const confidenceLevels = ['low', 'medium', 'high'];
  const statuses = ['pending', 'completed', 'escalated'];
  
  // Use different local test images from our collection
  const imageUrls = [
    '/test_images/photo4.jpg',
    '/test_images/photo5.jpg',
    '/test_images/photo6.jpg',
    '/test_images/photo7.jpg',
    '/test_images/photo8.jpg',
    '/test_images/photo9.jpg',
    '/test_images/photo10.jpg',
    '/test_images/photo11.jpg',
    '/test_images/photo12.jpg',
    '/test_images/photo13.jpg',
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const hashAlgo = hashAlgorithms[Math.floor(Math.random() * hashAlgorithms.length)];
    const confidence = confidenceLevels[Math.floor(Math.random() * confidenceLevels.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const imageUrl = imageUrls[i % imageUrls.length]; // Cycle through available images
    
    return {
      id: `task-${i + 1}`,
      image_id: i + 1,
      content_category: category,
      hash_algorithm: hashAlgo,
      confidence_level: confidence,
      is_escalated: Math.random() > 0.7, // 30% chance to be escalated
      status: status,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(), // Random date within the last week
      metadata: {
        source: `Source ${i + 1}`,
        reporter: Math.random() > 0.5 ? 'User' : 'System',
        report_reason: `Reason ${i + 1}`
      },
      image: {
        id: i + 1,
        filename: `image_${i + 1}.jpg`,
        upload_date: new Date(Date.now() - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)).toISOString(), // Random date within the last 2 weeks
        url: imageUrl,
        size: Math.floor(Math.random() * 5000000) + 1000000, // Size between 1MB and 6MB
        width: 800,
        height: 600,
        mime_type: 'image/jpeg',
        hashes: [
          {
            algorithm: hashAlgo,
            hash: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
            quality: Math.floor(Math.random() * 30) + 70 // Quality between 70 and 100
          }
        ]
      }
    };
  });
}

// Add the Tasks page component
import { useState, useEffect } from 'react';
import { Box, Container, Heading, SimpleGrid, Card, CardHeader, CardBody, Text, Image, Badge, Flex, Button, useToast, Spinner, Center } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FiArrowRight } from 'react-icons/fi';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    // Simulate API call
    const fetchTasks = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        // For now, use mock data
        setTimeout(() => {
          const mockTasks = getMockTasks(12);
          setTasks(mockTasks);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: 'Error fetching tasks',
          description: 'An error occurred while fetching the tasks.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setLoading(false);
      }
    };

    fetchTasks();
  }, [toast]);

  const handleTaskClick = (taskId) => {
    router.push(`/review?taskId=${taskId}`);
  };

  // Function to get badge color based on category
  const getCategoryColor = (category) => {
    const colorMap = {
      'fowl_play': 'red',
      'wild_duckery': 'blue',
      'rotten_eggs': 'yellow',
    };
    return colorMap[category] || 'gray';
  };

  return (
    <Container maxW="container.xl" py={6}>
      <Heading mb={6}>Content Review Tasks</Heading>

      {loading ? (
        <Center h="60vh">
          <Spinner size="xl" />
        </Center>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {tasks.map((task) => (
            <Card key={task.id} cursor="pointer" onClick={() => handleTaskClick(task.id)} h="100%" boxShadow="md" transition="transform 0.2s" _hover={{ transform: 'scale(1.02)' }}>
              <CardHeader pb={0}>
                <Flex justifyContent="space-between" alignItems="center">
                  <Badge colorScheme={getCategoryColor(task.content_category)}>
                    {task.content_category.replace('_', ' ')}
                  </Badge>
                  {task.is_escalated && (
                    <Badge colorScheme="red">Escalated</Badge>
                  )}
                </Flex>
              </CardHeader>
              <CardBody>
                <Box position="relative" overflow="hidden" borderRadius="md" mb={3}>
                  <Image 
                    src={task.image.url} 
                    alt={`Task ${task.id}`} 
                    objectFit="cover"
                    height="150px"
                    width="100%"
                    fallbackSrc="https://via.placeholder.com/300x150?text=Image+Unavailable"
                  />
                </Box>
                <Flex direction="column" gap={2}>
                  <Text fontWeight="bold">Task ID: {task.id}</Text>
                  <Text fontSize="sm">Algorithm: {task.hash_algorithm}</Text>
                  <Text fontSize="sm">Confidence: {task.confidence_level}</Text>
                  <Text fontSize="sm">Status: {task.status}</Text>
                  <Text fontSize="sm" color="gray.500">
                    Created: {new Date(task.created_at).toLocaleDateString()}
                  </Text>
                  <Button rightIcon={<FiArrowRight />} size="sm" mt={2} colorScheme="blue" variant="outline">
                    Review Task
                  </Button>
                </Flex>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
} 