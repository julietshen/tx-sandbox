import { Box, Badge, Image, Text, Stack, Heading, useColorModeValue, Flex, Tag, TagLabel, Tooltip } from "@chakra-ui/react";

interface HashInfo {
  algorithm: string;
  hash: string;
  quality?: number;
}

interface ImageCardProps {
  src: string;
  alt: string;
  filename: string;
  uploadDate: string;
  hashes: HashInfo[];
  isSelected?: boolean;
  onClick?: () => void;
}

export default function ImageCard({ 
  src, 
  alt, 
  filename, 
  uploadDate, 
  hashes,
  isSelected = false,
  onClick
}: ImageCardProps) {
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const selectedBorderColor = useColorModeValue("blue.500", "blue.300");
  const bgColor = useColorModeValue("white", "gray.700");
  
  // Format the date
  const formattedDate = new Date(uploadDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Truncate the hash for display
  const truncateHash = (hash: string) => {
    if (!hash) return '';
    return hash.length > 16 ? `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}` : hash;
  };

  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      overflow="hidden" 
      borderColor={isSelected ? selectedBorderColor : borderColor}
      boxShadow={isSelected ? "md" : "base"}
      bg={bgColor}
      onClick={onClick}
      cursor={onClick ? "pointer" : "default"}
      transition="all 0.2s"
      _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
    >
      <Box position="relative">
        <Image
          src={src}
          alt={alt}
          objectFit="cover"
          width="100%"
          height="200px"
        />
        {isSelected && (
          <Badge 
            position="absolute" 
            top="8px" 
            right="8px" 
            colorScheme="blue"
            borderRadius="full"
            px="2"
          >
            Selected
          </Badge>
        )}
      </Box>

      <Box p="6">
        <Stack spacing={2}>
          <Heading size="md" isTruncated>{filename}</Heading>
          <Text fontSize="sm" color="gray.500">{formattedDate}</Text>
          
          <Box mt={2}>
            <Text fontSize="sm" fontWeight="bold" mb={1}>Hashes:</Text>
            <Flex wrap="wrap" gap={2}>
              {hashes.map((hash, index) => (
                <Tooltip key={index} label={hash.hash} placement="top">
                  <Tag size="sm" variant="subtle" colorScheme={
                    hash.algorithm === 'pdq' ? 'green' :
                    hash.algorithm === 'md5' ? 'blue' :
                    hash.algorithm === 'sha1' ? 'purple' : 'gray'
                  }>
                    <TagLabel>{hash.algorithm.toUpperCase()}: {truncateHash(hash.hash)}</TagLabel>
                  </Tag>
                </Tooltip>
              ))}
            </Flex>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
} 