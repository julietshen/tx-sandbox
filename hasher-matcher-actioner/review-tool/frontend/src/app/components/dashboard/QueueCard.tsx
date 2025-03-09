import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Progress,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { QueueStats } from '../../types/queue';

interface QueueCardProps {
  queue: QueueStats;
  formatDuration: (seconds: number) => string;
  onReviewNext: (queueName: string) => void;
}

export const QueueCard: React.FC<QueueCardProps> = ({ 
  queue, 
  formatDuration,
  onReviewNext
}) => {
  const {
    queueName,
    contentCategory,
    hashAlgorithm,
    isEscalated,
    pending,
    active,
    completed,
    successRate,
    oldestTaskAge,
  } = queue;

  // Determine color coding based on metrics
  const getAgeColor = (seconds: number) => {
    if (seconds < 3600) return 'green.500'; // < 1 hour
    if (seconds < 86400) return 'yellow.500'; // < 1 day
    return 'red.500'; // >= 1 day
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 70) return 'green.500';
    if (rate >= 40) return 'yellow.500';
    return 'red.500';
  };

  // Format category name for display
  const formatCategory = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Determine algorithm badge color
  const getAlgorithmColor = (algo: string) => {
    switch(algo) {
      case 'pdq': return 'blue';
      case 'md5': return 'purple';
      case 'sha1': return 'teal';
      case 'escalated': return 'red';
      case 'manual': return 'orange';
      default: return 'gray';
    }
  };

  // Handle review button click
  const handleReviewClick = () => {
    onReviewNext(queueName);
  };

  // Styles
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.700', 'white');

  return (
    <Box 
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
      boxShadow="sm"
      transition="transform 0.2s"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
    >
      {/* Card Header */}
      <Box p={4} borderBottomWidth="1px" borderColor={borderColor}>
        <Flex justify="space-between" align="center">
          <Heading size="md" color={headingColor}>
            {formatCategory(contentCategory)}
          </Heading>
          <Flex>
            <Badge 
              colorScheme={getAlgorithmColor(hashAlgorithm)} 
              mr={2}
              fontSize="0.8em"
            >
              {hashAlgorithm.toUpperCase()}
            </Badge>
            {isEscalated && (
              <Badge colorScheme="red" fontSize="0.8em">ESCALATED</Badge>
            )}
          </Flex>
        </Flex>
      </Box>

      {/* Card Body */}
      <Box p={4}>
        {/* Queue Stats */}
        <Flex justify="space-between" mb={4}>
          <Stat>
            <StatLabel>Pending</StatLabel>
            <StatNumber>{pending}</StatNumber>
            <StatHelpText>{active} In Review</StatHelpText>
          </Stat>
          
          <Stat textAlign="center">
            <StatLabel>Success Rate</StatLabel>
            <StatNumber color={getSuccessRateColor(successRate)}>
              {successRate.toFixed(1)}%
            </StatNumber>
            <StatHelpText>{completed} Completed</StatHelpText>
          </Stat>
          
          <Stat textAlign="right">
            <StatLabel>Oldest Task</StatLabel>
            <StatNumber color={getAgeColor(oldestTaskAge)}>
              {formatDuration(oldestTaskAge)}
            </StatNumber>
            <StatHelpText>
              {oldestTaskAge === 0 ? 'No tasks waiting' : 'Waiting'}
            </StatHelpText>
          </Stat>
        </Flex>

        {/* Progress Bar */}
        <Box mb={4}>
          <Flex justify="space-between" mb={1}>
            <Text fontSize="sm">Queue Progress</Text>
            <Text fontSize="sm" fontWeight="bold">
              {completed}/{pending + active + completed} Reviews
            </Text>
          </Flex>
          <Progress 
            value={(completed / (pending + active + completed || 1)) * 100} 
            colorScheme="blue" 
            borderRadius="full"
            size="sm"
          />
        </Box>

        {/* Action Button */}
        <Button 
          colorScheme="blue" 
          size="sm" 
          width="full"
          isDisabled={pending === 0}
          onClick={handleReviewClick}
        >
          {pending > 0 ? `Review Next Task (${pending})` : 'No Tasks Available'}
        </Button>
      </Box>
    </Box>
  );
}; 