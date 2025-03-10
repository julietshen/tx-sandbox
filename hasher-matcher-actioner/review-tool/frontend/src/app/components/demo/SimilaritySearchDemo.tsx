'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
  VStack,
  useToast,
  Spinner,
  Badge,
  Tooltip,
  HStack,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { MdFileUpload, MdSearch, MdShuffle } from 'react-icons/md';
import HashIndexService from '@/app/services/HashIndexService';

interface Match {
  id: number;
  distance: number;
  metadata: Record<string, any>;
  hash?: string;
  image_path?: string;
}

export default function SimilaritySearchDemo() {
  // Initialize all state with null/empty values to avoid hydration mismatches
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasIndexedImages, setHasIndexedImages] = useState(false);
  const [randomHashLoading, setRandomHashLoading] = useState(false);
  const toast = useToast();

  // Check if there are indexed images on component mount - client-side only
  useEffect(() => {
    const checkIndexedImages = async () => {
      try {
        const hasImages = await HashIndexService.hasIndexedImages();
        setHasIndexedImages(hasImages);
      } catch (error) {
        console.error('Error checking indexed images:', error);
        setHasIndexedImages(false);
      }
    };

    checkIndexedImages();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target) {
          setPreviewUrl(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = async () => {
    if (!selectedFile) {
      toast({
        title: 'No image selected',
        description: 'Please select an image to search for similar images',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    setMatches([]);

    try {
      // Use PDQ algorithm with a threshold of 80 (moderately similar images)
      const result = await HashIndexService.findNearestMatches(selectedFile, null, 80);
      
      if (result && result.matches) {
        // Sort matches by PDQ distance (lower is more similar)
        const sortedMatches = result.matches.sort((a: Match, b: Match) => a.distance - b.distance);
        setMatches(sortedMatches);
        
        toast({
          title: 'Search complete',
          description: `Found ${sortedMatches.length} similar images using PDQ algorithm`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'No matches found',
          description: 'No similar images were found in the database',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error searching for similar images:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for similar images',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRandomSearch = async () => {
    setRandomHashLoading(true);
    setMatches([]);
    setSelectedFile(null);
    setPreviewUrl(null);

    try {
      const randomHash = await HashIndexService.getRandomHash();
      
      if (!randomHash) {
        toast({
          title: 'No indexed images',
          description: 'There are no indexed images to search from',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        setRandomHashLoading(false);
        return;
      }

      // Set preview URL if available in the random hash
      if (randomHash.image_path) {
        setPreviewUrl(`/api/images/${randomHash.image_path}`);
      }

      // Search for similar images using the random hash with PDQ algorithm
      const result = await HashIndexService.findNearestMatches(null, randomHash.hash, 80);
      
      if (result && result.matches) {
        // Sort matches by PDQ distance (lower is more similar)
        const sortedMatches = result.matches.sort((a: Match, b: Match) => a.distance - b.distance);
        setMatches(sortedMatches);
        
        toast({
          title: 'Random search complete',
          description: `Found ${sortedMatches.length} similar images using PDQ algorithm`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error performing random search:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform random search',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setRandomHashLoading(false);
    }
  };

  // Function to determine badge color based on PDQ distance
  const getDistanceBadgeColor = (distance: number) => {
    if (distance < 30) return 'green';
    if (distance < 60) return 'yellow';
    if (distance < 80) return 'orange';
    return 'red';
  };

  // Function to interpret the PDQ distance
  const interpretDistance = (distance: number) => {
    if (distance < 30) return 'Very similar';
    if (distance < 60) return 'Somewhat similar';
    if (distance < 80) return 'Slightly similar';
    return 'Not similar';
  };

  return (
    <Box>
      <Card mb={6}>
        <CardHeader>
          <Heading size="md">PDQ Similarity Search</Heading>
        </CardHeader>
        <CardBody>
          <Text mb={4}>
            Upload an image to find visually similar images in the database. This demo uses PDQ (Perceptual
            Difference Quantization) hashing from the Hasher-Matcher-Actioner framework to identify similar 
            images regardless of size, format, or minor modifications.
          </Text>
          
          {!hasIndexedImages && (
            <Alert status="info" mb={4}>
              <AlertIcon />
              <AlertTitle>No indexed images</AlertTitle>
              <AlertDescription>
                Upload an image to start building the index. Images from all sources will be automatically indexed.
              </AlertDescription>
            </Alert>
          )}

          <VStack spacing={6} align="stretch">
            <FormControl>
              <FormLabel>Upload an image to search</FormLabel>
              <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  display="none"
                  id="file-upload"
                />
                <Button
                  as="label"
                  htmlFor="file-upload"
                  leftIcon={<MdFileUpload />}
                  colorScheme="blue"
                  variant="outline"
                  cursor="pointer"
                >
                  {selectedFile ? 'Change Image' : 'Upload Image'}
                </Button>
                <Button
                  onClick={handleSearch}
                  leftIcon={<MdSearch />}
                  colorScheme="blue"
                  isLoading={loading}
                  isDisabled={!selectedFile || loading}
                >
                  Search Similar Images
                </Button>
                <Button
                  onClick={handleRandomSearch}
                  leftIcon={<MdShuffle />}
                  variant="ghost"
                  isLoading={randomHashLoading}
                  isDisabled={!hasIndexedImages || randomHashLoading}
                >
                  Random Search
                </Button>
              </Flex>
            </FormControl>

            {selectedFile && (
              <Text fontSize="sm">
                Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </Text>
            )}

            {previewUrl && (
              <Box borderWidth="1px" borderRadius="lg" overflow="hidden" alignSelf="center">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  maxH="300px"
                  objectFit="contain"
                />
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>

      {loading && (
        <Flex justify="center" my={8}>
          <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
        </Flex>
      )}

      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <Heading size="md">Search Results</Heading>
            <Text mt={2} fontSize="sm" color="gray.500">
              Showing {matches.length} similar images sorted by PDQ distance (lower is more similar)
            </Text>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
              {matches.map((match, index) => (
                <Card key={index} variant="outline">
                  <CardBody>
                    <VStack spacing={2} align="stretch">
                      {match.image_path && (
                        <Image
                          src={`/api/images/${match.image_path}`}
                          alt={`Match ${index + 1}`}
                          borderRadius="md"
                          objectFit="cover"
                          height="150px"
                        />
                      )}
                      <HStack justify="space-between">
                        <Badge colorScheme={getDistanceBadgeColor(match.distance)}>
                          {interpretDistance(match.distance)}
                        </Badge>
                        <Tooltip label="PDQ Distance (lower is more similar)">
                          <Badge variant="outline">{match.distance.toFixed(1)}</Badge>
                        </Tooltip>
                      </HStack>
                      {match.metadata && match.metadata.source && (
                        <Text fontSize="xs" color="gray.500">
                          Source: {match.metadata.source}
                        </Text>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>
      )}
    </Box>
  );
} 