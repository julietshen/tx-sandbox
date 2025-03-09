/**
 * PendingCountDisplay - Component for displaying pending task count
 * 
 * This component ensures consistency between the oldest task duration and pending count:
 * - If the duration is "None", the pending count is 0
 * - Otherwise, it shows a realistic count based on the row index
 */

import React from 'react';
import { Text, useColorModeValue } from '@chakra-ui/react';
import { mockDurations } from '../../utils/mockData';

interface PendingCountDisplayProps {
  index: number;
}

export default function PendingCountDisplay({ index }: PendingCountDisplayProps) {
  // Get the duration for this index
  const duration = mockDurations[index % mockDurations.length];
  
  // If the duration is "None", show 0 pending tasks
  // Otherwise, show a realistic count based on the index
  const count = duration === 'None' ? 0 : (index % 25) + 1;
  
  return (
    <Text 
      fontWeight="bold" 
      fontSize="lg" 
      color={useColorModeValue("blue.600", "blue.300")}
    >
      {count}
    </Text>
  );
} 