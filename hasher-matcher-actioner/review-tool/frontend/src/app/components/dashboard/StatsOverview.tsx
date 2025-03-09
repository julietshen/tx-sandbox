import React from 'react';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Flex,
  Icon,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiClock, FiCheckCircle, FiUserCheck, FiAlertCircle } from 'react-icons/fi';

interface StatsOverviewProps {
  totalPending: number;
  totalActive: number;
  totalCompleted: number;
  avgSuccessRate: number;
  oldestTask: number;
  formatDuration: (seconds: number) => string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  totalPending,
  totalActive,
  totalCompleted,
  avgSuccessRate,
  oldestTask,
  formatDuration,
}) => {
  const bg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const iconBg = useColorModeValue('gray.100', 'gray.600');

  // Function to determine color for age indicator
  const getAgeColor = (seconds: number) => {
    if (seconds === 0) return 'gray.500';
    if (seconds < 3600) return 'green.500';
    if (seconds < 86400) return 'yellow.500';
    return 'red.500';
  };

  return (
    <Box 
      p={5} 
      borderWidth="1px" 
      borderRadius="lg" 
      bg={bg} 
      borderColor={borderColor}
      boxShadow="sm"
      mb={6}
    >
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        {/* Pending Tasks */}
        <Stat>
          <Flex alignItems="center">
            <Box
              p={2}
              borderRadius="md"
              bg={iconBg}
              mr={3}
            >
              <Icon as={FiAlertCircle} boxSize={6} color="blue.500" />
            </Box>
            <Box>
              <StatLabel>Pending Tasks</StatLabel>
              <StatNumber>{totalPending}</StatNumber>
              <StatHelpText>
                <Flex alignItems="center">
                  <Text>{totalActive} in review</Text>
                </Flex>
              </StatHelpText>
            </Box>
          </Flex>
        </Stat>

        {/* Completed Reviews */}
        <Stat>
          <Flex alignItems="center">
            <Box
              p={2}
              borderRadius="md"
              bg={iconBg}
              mr={3}
            >
              <Icon as={FiCheckCircle} boxSize={6} color="green.500" />
            </Box>
            <Box>
              <StatLabel>Completed Reviews</StatLabel>
              <StatNumber>{totalCompleted}</StatNumber>
              <StatHelpText>
                <Flex alignItems="center">
                  <StatArrow type="increase" />
                  <Text>23% increase</Text>
                </Flex>
              </StatHelpText>
            </Box>
          </Flex>
        </Stat>

        {/* Success Rate */}
        <Stat>
          <Flex alignItems="center">
            <Box
              p={2}
              borderRadius="md"
              bg={iconBg}
              mr={3}
            >
              <Icon as={FiUserCheck} boxSize={6} color="purple.500" />
            </Box>
            <Box>
              <StatLabel>Success Rate</StatLabel>
              <StatNumber>{avgSuccessRate.toFixed(1)}%</StatNumber>
              <StatHelpText>
                <Flex alignItems="center">
                  <StatArrow type={avgSuccessRate > 50 ? "increase" : "decrease"} />
                  <Text>From previous period</Text>
                </Flex>
              </StatHelpText>
            </Box>
          </Flex>
        </Stat>

        {/* Oldest Task */}
        <Stat>
          <Flex alignItems="center">
            <Box
              p={2}
              borderRadius="md"
              bg={iconBg}
              mr={3}
            >
              <Icon as={FiClock} boxSize={6} color={getAgeColor(oldestTask)} />
            </Box>
            <Box>
              <StatLabel>Oldest Pending Task</StatLabel>
              <StatNumber>
                {oldestTask === 0 ? 'No tasks pending' : formatDuration(oldestTask)}
              </StatNumber>
              <StatHelpText>
                {oldestTask > 0 && 'Requires attention'}
                {oldestTask === 0 && 'All caught up!'}
              </StatHelpText>
            </Box>
          </Flex>
        </Stat>
      </SimpleGrid>
    </Box>
  );
}; 