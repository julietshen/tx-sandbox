import { Box, Table, Thead, Tbody, Tr, Th, Td, Badge, Text, Tooltip, Icon, VStack, HStack, Divider, useColorModeValue } from "@chakra-ui/react";
import { InfoIcon } from "@chakra-ui/icons";
import { Match } from "../../types/queue";

interface MatchDetailsProps {
  matches: Match[];
}

export default function MatchDetails({ matches }: MatchDetailsProps) {
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const bgColor = useColorModeValue("white", "gray.700");

  // Get color and text description based on match distance
  const getMatchQuality = (algorithm: string, distance: number) => {
    // Different algorithms have different thresholds
    if (algorithm === 'pdq') {
      if (distance <= 10) return { color: 'green', text: 'Exact Match' };
      if (distance <= 30) return { color: 'yellow', text: 'Strong Match' };
      if (distance <= 50) return { color: 'orange', text: 'Moderate Match' };
      return { color: 'red', text: 'Weak Match' };
    }
    
    if (algorithm === 'md5' || algorithm === 'sha1') {
      return distance === 0 
        ? { color: 'green', text: 'Exact Match' }
        : { color: 'red', text: 'No Match' };
    }
    
    // Default
    if (distance <= 20) return { color: 'green', text: 'Strong Match' };
    if (distance <= 50) return { color: 'yellow', text: 'Moderate Match' };
    return { color: 'red', text: 'Weak Match' };
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (matches.length === 0) {
    return (
      <Box p={4} borderRadius="md" bg={bgColor}>
        <Text fontStyle="italic" color="gray.500">
          No matches found. This content was manually submitted for review.
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {matches.map((match, index) => {
        const quality = getMatchQuality(match.hash_algorithm, match.distance);
        const metadata = match.reference_metadata || {};
        
        return (
          <Box 
            key={match.match_id || index}
            borderWidth="1px" 
            borderRadius="lg" 
            borderColor={borderColor} 
            bg={bgColor}
            p={3}
          >
            <VStack align="stretch" spacing={3}>
              <HStack justifyContent="space-between">
                <HStack>
                  <Badge colorScheme={quality.color} px={2} py={1} borderRadius="md">
                    {quality.text}
                  </Badge>
                  <Badge colorScheme="blue" px={2} py={1} borderRadius="md">
                    {match.hash_algorithm.toUpperCase()}
                  </Badge>
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  Match ID: {match.match_id || 'Unknown'}
                </Text>
              </HStack>
              
              <Divider />
              
              <Table variant="simple" size="sm">
                <Tbody>
                  <Tr>
                    <Td fontWeight="bold" width="30%">Reference Source</Td>
                    <Td>{match.reference_source || 'Unknown'}</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Reference ID</Td>
                    <Td>{match.reference_id || 'Unknown'}</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="bold">Match Distance</Td>
                    <Td>
                      {match.distance}
                      <Tooltip label="Lower values indicate closer matches. The threshold varies by algorithm.">
                        <span><Icon as={InfoIcon} ml={1} boxSize={3} color="gray.500" /></span>
                      </Tooltip>
                    </Td>
                  </Tr>
                  {metadata.category && (
                    <Tr>
                      <Td fontWeight="bold">Category</Td>
                      <Td>{metadata.category}</Td>
                    </Tr>
                  )}
                  {metadata.severity && (
                    <Tr>
                      <Td fontWeight="bold">Severity</Td>
                      <Td>{metadata.severity}</Td>
                    </Tr>
                  )}
                  {metadata.added_date && (
                    <Tr>
                      <Td fontWeight="bold">Date Added</Td>
                      <Td>{formatDate(metadata.added_date)}</Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </VStack>
          </Box>
        );
      })}
    </VStack>
  );
} 