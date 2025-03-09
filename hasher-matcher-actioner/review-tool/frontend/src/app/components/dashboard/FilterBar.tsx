import React from 'react';
import {
  Flex,
  Box,
  Select,
  HStack,
  FormControl,
  FormLabel,
  Switch,
  useColorModeValue,
} from '@chakra-ui/react';

interface FilterBarProps {
  categories: string[];
  hashAlgorithms: string[];
  confidenceLevels: string[];
  selectedCategory: string;
  selectedHashAlgorithm: string;
  selectedConfidenceLevel: string;
  showEscalated: boolean;
  sortBy: string;
  onCategoryChange: (value: string) => void;
  onHashAlgorithmChange: (value: string) => void;
  onConfidenceLevelChange: (value: string) => void;
  onEscalatedChange: (value: boolean) => void;
  onSortByChange: (value: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  categories,
  hashAlgorithms,
  confidenceLevels,
  selectedCategory,
  selectedHashAlgorithm,
  selectedConfidenceLevel,
  showEscalated,
  sortBy,
  onCategoryChange,
  onHashAlgorithmChange,
  onConfidenceLevelChange,
  onEscalatedChange,
  onSortByChange,
}) => {
  const bg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box 
      p={4} 
      bg={bg} 
      borderRadius="md" 
      boxShadow="sm" 
      borderWidth="1px" 
      borderColor={borderColor}
      mb={6}
    >
      <Flex 
        direction={{ base: 'column', md: 'row' }} 
        gap={4} 
        alignItems={{ base: 'flex-start', md: 'center' }}
        flexWrap="wrap"
      >
        {/* Hash Algorithm Filter */}
        <FormControl w={{ base: 'full', md: 'auto' }}>
          <FormLabel htmlFor="hash-algo" mb={1} fontSize="sm">Hash Algorithm</FormLabel>
          <Select
            id="hash-algo"
            value={selectedHashAlgorithm}
            onChange={(e) => onHashAlgorithmChange(e.target.value)}
            placeholder="All Algorithms"
            size="sm"
            minW="150px"
          >
            {hashAlgorithms.map((algo) => (
              <option key={algo} value={algo}>
                {algo.toUpperCase()}
              </option>
            ))}
          </Select>
        </FormControl>

        {/* Confidence Level Filter */}
        <FormControl w={{ base: 'full', md: 'auto' }}>
          <FormLabel htmlFor="confidence" mb={1} fontSize="sm">Confidence Level</FormLabel>
          <Select
            id="confidence"
            value={selectedConfidenceLevel}
            onChange={(e) => onConfidenceLevelChange(e.target.value)}
            placeholder="All Confidence Levels"
            size="sm"
            minW="150px"
          >
            {confidenceLevels.map((level) => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </Select>
        </FormControl>

        {/* Sort By */}
        <FormControl w={{ base: 'full', md: 'auto' }}>
          <FormLabel htmlFor="sort-by" mb={1} fontSize="sm">Sort By</FormLabel>
          <Select
            id="sort-by"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            size="sm"
            minW="150px"
          >
            <option value="oldest">Oldest First</option>
            <option value="pending">Most Pending</option>
            <option value="success">Success Rate</option>
          </Select>
        </FormControl>

        {/* Escalated Toggle */}
        <FormControl display="flex" alignItems="center" ml={{ base: 0, md: 'auto' }}>
          <FormLabel htmlFor="escalated-switch" mb={0} fontSize="sm" mr={2}>
            Show Escalated
          </FormLabel>
          <Switch
            id="escalated-switch"
            isChecked={showEscalated}
            onChange={(e) => onEscalatedChange(e.target.checked)}
            colorScheme="red"
          />
        </FormControl>
      </Flex>
    </Box>
  );
}; 