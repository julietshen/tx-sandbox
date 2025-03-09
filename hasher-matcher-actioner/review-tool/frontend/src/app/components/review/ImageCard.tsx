'use client';

import React from 'react';
import {
  Box,
  Text,
  Flex,
  Badge,
  VStack,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { Image } from '../../types/queue';

interface ImageCardProps {
  image: Image;
  selectedAlgorithm?: string;
  isCompact?: boolean;
  onClick?: () => void;
}

const ImageCard: React.FC<ImageCardProps> = ({
  image,
  selectedAlgorithm,
  isCompact = false,
  onClick
}) => {
  const {
    id,
    filename,
    upload_date,
    url,
    hashes
  } = image;

  // Format the display of hash values
  const formatHash = (hash: string): string => {
    if (hash.length <= 16) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  // Get badge color based on hash algorithm
  const getHashBadgeColor = (algorithm: string): string => {
    switch (algorithm.toLowerCase()) {
      case 'pdq': return 'blue';
      case 'md5': return 'purple';
      case 'sha1': return 'teal';
      default: return 'gray';
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Styles
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Check if image URL is a placeholder
  const isPlaceholder = url.includes('placeholder.com') || url.includes('unsplash.com');
  const imageUrl = isPlaceholder ? url : url.startsWith('http') ? url : `/api/images/${id}/data`;

  // Compact view (for similar images list)
  if (isCompact) {
    return (
      <Box
        borderWidth="1px"
        borderRadius="md"
        overflow="hidden"
        borderColor={borderColor}
        boxShadow="sm"
        cursor={onClick ? 'pointer' : 'default'}
        transition="transform 0.2s"
        _hover={{ transform: onClick ? 'translateY(-2px)' : 'none', boxShadow: onClick ? 'md' : 'sm' }}
        onClick={onClick}
      >
        <Flex direction="row" height="100px">
          <Box
            width="100px"
            height="100px"
            bgImage={`url(${imageUrl})`}
            bgSize="cover"
            bgPosition="center"
          />
          <Box p={2} flex="1">
            <Text fontWeight="bold" fontSize="sm" noOfLines={1}>{filename}</Text>
            <HStack mt={1}>
              {hashes.map((hash, index) => (
                <Badge
                  key={index}
                  colorScheme={getHashBadgeColor(hash.algorithm)}
                  fontSize="xs"
                >
                  {hash.algorithm.toUpperCase()}
                </Badge>
              ))}
            </HStack>
          </Box>
        </Flex>
      </Box>
    );
  }

  // Full view (for main image)
  return (
    <VStack spacing={4} align="stretch">
      <Box
        position="relative"
        borderRadius="md"
        overflow="hidden"
        borderWidth="1px"
        borderColor={borderColor}
        boxShadow="md"
      >
        <Box
          as="img"
          src={imageUrl}
          alt={filename}
          maxH="500px"
          width="100%"
          objectFit="contain"
          bg="gray.100"
        />
      </Box>

      <Flex justify="space-between" wrap="wrap">
        <Box flex="1" mr={4}>
          <Text fontWeight="bold">Filename:</Text>
          <Text>{filename}</Text>
        </Box>
        <Box>
          <Text fontWeight="bold">Upload Date:</Text>
          <Text>{formatDate(upload_date)}</Text>
        </Box>
      </Flex>

      <Box>
        <Text fontWeight="bold" mb={2}>Hash Information:</Text>
        <Flex gap={2} wrap="wrap">
          {hashes.map((hash, index) => (
            <Badge
              key={index}
              colorScheme={
                selectedAlgorithm && hash.algorithm === selectedAlgorithm
                  ? 'green'
                  : getHashBadgeColor(hash.algorithm)
              }
              p={2}
              borderRadius="md"
            >
              {hash.algorithm.toUpperCase()}: {formatHash(hash.hash)}
              {hash.quality !== undefined && ` (Quality: ${hash.quality})`}
            </Badge>
          ))}
        </Flex>
      </Box>
    </VStack>
  );
};

export default ImageCard; 