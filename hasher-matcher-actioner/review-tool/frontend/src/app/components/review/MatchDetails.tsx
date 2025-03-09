import { Box, Table, Thead, Tbody, Tr, Th, Td, Badge, Text, useColorModeValue } from "@chakra-ui/react";

interface Match {
  id: number;
  algorithm: string;
  distance: number;
  matchDate: string;
  matchedImageId: number;
  matchedImageFilename: string;
}

interface MatchDetailsProps {
  matches: Match[];
}

export default function MatchDetails({ matches }: MatchDetailsProps) {
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const bgColor = useColorModeValue("white", "gray.700");

  // Get color and text description based on match quality
  const getMatchQuality = (algorithm: string, distance: number) => {
    // Different algorithms have different thresholds
    if (algorithm === 'pdq') {
      if (distance < 0.1) return { color: 'green', text: 'Exact Match' };
      if (distance < 0.3) return { color: 'yellow', text: 'Strong Match' };
      if (distance < 0.5) return { color: 'orange', text: 'Moderate Match' };
      return { color: 'red', text: 'Weak Match' };
    }
    
    if (algorithm === 'md5' || algorithm === 'sha1') {
      return distance === 0 
        ? { color: 'green', text: 'Exact Match' }
        : { color: 'red', text: 'No Match' };
    }
    
    // Default
    if (distance < 0.2) return { color: 'green', text: 'Strong Match' };
    if (distance < 0.5) return { color: 'yellow', text: 'Moderate Match' };
    return { color: 'red', text: 'Weak Match' };
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (matches.length === 0) {
    return (
      <Box p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor} bg={bgColor}>
        <Text fontStyle="italic" color="gray.500">No matches found</Text>
      </Box>
    );
  }

  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      borderColor={borderColor} 
      bg={bgColor}
      overflowX="auto"
    >
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Matched Image</Th>
            <Th>Algorithm</Th>
            <Th>Match Quality</Th>
            <Th>Distance</Th>
            <Th>Date</Th>
          </Tr>
        </Thead>
        <Tbody>
          {matches.map((match) => {
            const quality = getMatchQuality(match.algorithm, match.distance);
            return (
              <Tr key={match.id}>
                <Td>{match.matchedImageFilename}</Td>
                <Td textTransform="uppercase">{match.algorithm}</Td>
                <Td>
                  <Badge colorScheme={quality.color}>{quality.text}</Badge>
                </Td>
                <Td isNumeric>{match.distance.toFixed(4)}</Td>
                <Td>{formatDate(match.matchDate)}</Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
} 