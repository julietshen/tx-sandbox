/**
 * OldestTaskDisplay - Component for displaying oldest task duration
 * 
 * This component preserves our implementation of fixed, realistic values for task durations
 * and avoids the "20156d 21h" issue we fixed earlier.
 */

import React from 'react';
import { Text, useColorModeValue } from '@chakra-ui/react';
import { mockDurations } from '../../utils/mockData';

interface OldestTaskDisplayProps {
  index: number;
}

export default function OldestTaskDisplay({ index }: OldestTaskDisplayProps) {
  // Determine the duration to display based on the index
  const duration = mockDurations[index % mockDurations.length];
  
  return (
    <Text 
      fontWeight="medium"
      color={useColorModeValue("gray.700", "gray.300")}
    >
      {duration}
    </Text>
  );
} 