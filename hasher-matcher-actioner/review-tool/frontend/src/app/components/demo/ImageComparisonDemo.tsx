'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Input,
  Button,
  Grid,
  GridItem,
  Flex,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  FormControl,
  FormLabel,
  InputGroup,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { MdFileUpload, MdInfo } from 'react-icons/md';
import HashIndexService from '@/app/services/HashIndexService';

// Use the same enum as the backend to ensure compatibility
enum HashingAlgorithm {
  PDQ = "pdq",
  MD5 = "md5",
  SHA1 = "sha1",
  PHOTODNA = "photodna",
  NETCLEAN = "netclean"
}

interface AlgorithmResult {
  distance: number;
  quality1: number;
  quality2: number;
  interpretation: string;
  error?: string;
  hash1?: string;
  hash2?: string;
}

interface ComparisonResults {
  image1?: {
    name: string;
    size: number;
    width: number;
    height: number;
  };
  image2?: {
    name: string;
    size: number;
    width: number;
    height: number;
  };
  results: Record<HashingAlgorithm, AlgorithmResult>;
  success?: boolean;
}

export default function ImageComparisonDemo() {
  // Use useState with null initial values to avoid hydration mismatches
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);
  const [image1Preview, setImage1Preview] = useState<string | null>(null);
  const [image2Preview, setImage2Preview] = useState<string | null>(null);
  const [results, setResults] = useState<ComparisonResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use useRef for file input references
  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);

  // Use a consistent color mode value
  const cardBg = useColorModeValue('white', 'gray.700');

  // Handle file changes in a client-side only way
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, imageNumber: 1 | 2) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      if (imageNumber === 1) {
        setImage1(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target) {
            setImage1Preview(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setImage2(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target) {
            setImage2Preview(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
      
      // Clear previous results when a new image is selected
      setResults(null);
      setError(null);
    }
  };

  const handleCompare = async () => {
    if (!image1 || !image2) {
      setError('Please select two images to compare');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('image1', image1);
      formData.append('image2', image2);

      const response = await fetch('http://localhost:8000/compare', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      // Validate the response data before setting it
      if (data && data.results) {
        setResults(data);
        
        // Index both images for similarity search using HMA's indexing functionality
        try {
          await HashIndexService.indexImage(image1, 'image_comparison_demo');
          console.log(`Indexed ${image1.name} for similarity search`);
          
          await HashIndexService.indexImage(image2, 'image_comparison_demo');
          console.log(`Indexed ${image2.name} for similarity search`);
        } catch (indexError) {
          console.error('Error indexing images:', indexError);
          // Don't fail the comparison if indexing fails
        }
      } else {
        console.error('Invalid response data structure:', data);
        throw new Error('Invalid response data from server');
      }
      
    } catch (err) {
      console.error('Error comparing images:', err);
      setError('Failed to compare images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = (imageNumber: 1 | 2) => {
    if (imageNumber === 1 && fileInput1Ref.current) {
      fileInput1Ref.current.click();
    } else if (imageNumber === 2 && fileInput2Ref.current) {
      fileInput2Ref.current.click();
    }
  };

  const getDistanceColor = (algorithm: HashingAlgorithm, distance: number) => {
    if (algorithm === HashingAlgorithm.PDQ) {
      // PDQ distance interpretation based on HMA's thresholds
      if (distance < 30) return 'green';
      if (distance < 60) return 'yellow';
      if (distance < 80) return 'orange';
      return 'red';
    } else {
      // For cryptographic hashes like MD5 and SHA1
      if (distance < 1) return 'green';
      return 'red';
    }
  };

  return (
    <Box>
      <Card mb={6} bg={cardBg}>
        <CardHeader>
          <Heading size="md">Image Comparison with HMA</Heading>
        </CardHeader>
        <CardBody>
          <Text mb={4}>
            Compare two images using multiple hashing algorithms from the Hasher-Matcher-Actioner framework
            to detect similarities and differences. Uploaded images will be automatically indexed for similarity search.
          </Text>

          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
            {/* Image 1 Upload */}
            <GridItem>
              <FormControl>
                <FormLabel>Image 1</FormLabel>
                <InputGroup>
                  <Input
                    type="file"
                    accept="image/*"
                    ref={fileInput1Ref}
                    onChange={(e) => handleFileChange(e, 1)}
                    display="none"
                  />
                  <Button
                    leftIcon={<MdFileUpload />}
                    onClick={() => triggerFileInput(1)}
                    colorScheme="blue"
                    variant="outline"
                    isDisabled={loading}
                    width="100%"
                  >
                    {image1 ? 'Change Image 1' : 'Upload Image 1'}
                  </Button>
                </InputGroup>
                {image1 && (
                  <Text fontSize="sm" mt={2}>
                    Selected: {image1.name} ({Math.round(image1.size / 1024)} KB)
                  </Text>
                )}
                {image1Preview && (
                  <Box
                    mt={4}
                    borderWidth="1px"
                    borderRadius="lg"
                    overflow="hidden"
                    height="200px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <img
                      src={image1Preview}
                      alt="Preview 1"
                      style={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </Box>
                )}
              </FormControl>
            </GridItem>

            {/* Image 2 Upload */}
            <GridItem>
              <FormControl>
                <FormLabel>Image 2</FormLabel>
                <InputGroup>
                  <Input
                    type="file"
                    accept="image/*"
                    ref={fileInput2Ref}
                    onChange={(e) => handleFileChange(e, 2)}
                    display="none"
                  />
                  <Button
                    leftIcon={<MdFileUpload />}
                    onClick={() => triggerFileInput(2)}
                    colorScheme="blue"
                    variant="outline"
                    isDisabled={loading}
                    width="100%"
                  >
                    {image2 ? 'Change Image 2' : 'Upload Image 2'}
                  </Button>
                </InputGroup>
                {image2 && (
                  <Text fontSize="sm" mt={2}>
                    Selected: {image2.name} ({Math.round(image2.size / 1024)} KB)
                  </Text>
                )}
                {image2Preview && (
                  <Box
                    mt={4}
                    borderWidth="1px"
                    borderRadius="lg"
                    overflow="hidden"
                    height="200px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <img
                      src={image2Preview}
                      alt="Preview 2"
                      style={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </Box>
                )}
              </FormControl>
            </GridItem>
          </Grid>

          <Flex justifyContent="center" mt={6}>
            <Button
              colorScheme="blue"
              onClick={handleCompare}
              isLoading={loading}
              loadingText="Comparing..."
              isDisabled={!image1 || !image2 || loading}
              size="lg"
            >
              Compare Images
            </Button>
          </Flex>

          {error && (
            <Alert status="error" mt={6}>
              <AlertIcon />
              {error}
            </Alert>
          )}
        </CardBody>
      </Card>

      {loading && (
        <Flex justify="center" my={8}>
          <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
        </Flex>
      )}

      {results && results.image1 && results.image2 && (
        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md">Comparison Results</Heading>
          </CardHeader>
          <CardBody>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} mb={6}>
              <GridItem>
                <Box>
                  <Heading size="sm" mb={2}>Image 1 Details</Heading>
                  {results.image1.name && <Text>Name: {results.image1.name}</Text>}
                  {results.image1.size && <Text>Size: {Math.round(results.image1.size / 1024)} KB</Text>}
                  {results.image1.width && results.image1.height && (
                    <Text>Dimensions: {results.image1.width} x {results.image1.height}</Text>
                  )}
                </Box>
              </GridItem>
              <GridItem>
                <Box>
                  <Heading size="sm" mb={2}>Image 2 Details</Heading>
                  {results.image2.name && <Text>Name: {results.image2.name}</Text>}
                  {results.image2.size && <Text>Size: {Math.round(results.image2.size / 1024)} KB</Text>}
                  {results.image2.width && results.image2.height && (
                    <Text>Dimensions: {results.image2.width} x {results.image2.height}</Text>
                  )}
                </Box>
              </GridItem>
            </Grid>

            <Divider mb={6} />

            <Heading size="sm" mb={4}>Algorithm Results</Heading>

            {results.results && Object.entries(results.results).map(([algorithm, result]) => (
              <Card key={algorithm} variant="outline" mb={4}>
                <CardHeader py={3}>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Heading size="xs">{algorithm.toUpperCase()}</Heading>
                    <Tooltip label={result.interpretation}>
                      <Badge colorScheme={getDistanceColor(algorithm as HashingAlgorithm, result.distance)}>
                        Distance: {result.distance.toFixed(1)}
                      </Badge>
                    </Tooltip>
                  </Flex>
                </CardHeader>
                <CardBody pt={0}>
                  <Text fontSize="sm">{result.interpretation}</Text>
                  {result.error && (
                    <Alert status="warning" mt={2} size="sm">
                      <AlertIcon />
                      <Text fontSize="xs">{result.error}</Text>
                    </Alert>
                  )}
                  {result.hash1 && result.hash2 && (
                    <Box mt={2} fontSize="xs">
                      <Text fontWeight="bold">Hash 1:</Text>
                      <Text isTruncated>{result.hash1}</Text>
                      <Text fontWeight="bold" mt={1}>Hash 2:</Text>
                      <Text isTruncated>{result.hash2}</Text>
                    </Box>
                  )}
                </CardBody>
              </Card>
            ))}
          </CardBody>
        </Card>
      )}
    </Box>
  );
} 