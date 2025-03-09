'use client';

import { useEffect, useState } from 'react';
import { 
  Box, 
  Grid, 
  GridItem, 
  Heading, 
  Text, 
  VStack, 
  HStack,
  Flex,
  Divider,
  Select,
  Badge,
  useToast
} from '@chakra-ui/react';
import AppLayout from '../components/layout/AppLayout';
import ImageCard from '../components/review/ImageCard';
import ReviewActions from '../components/review/ReviewActions';
import MatchDetails from '../components/review/MatchDetails';

// Example data structure (this would come from your API)
interface Image {
  id: number;
  filename: string;
  uploadDate: string;
  url: string;
  hashes: Array<{
    algorithm: string;
    hash: string;
    quality?: number;
  }>;
}

interface Match {
  id: number;
  algorithm: string;
  distance: number;
  matchDate: string;
  matchedImageId: number;
  matchedImageFilename: string;
}

export default function ReviewPage() {
  const [currentImage, setCurrentImage] = useState<Image | null>(null);
  const [similarImages, setSimilarImages] = useState<Image[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [algorithm, setAlgorithm] = useState('pdq');
  const toast = useToast();

  // Fetch initial data
  useEffect(() => {
    // This would be an API call in a real application
    const fetchData = async () => {
      setLoading(true);
      try {
        // Simulate API call with timeout
        setTimeout(() => {
          // Mock data
          const mockCurrentImage: Image = {
            id: 1,
            filename: 'photo1.jpg',
            uploadDate: '2025-03-09T14:30:00Z',
            url: '/api/images/photo1.jpg',
            hashes: [
              { algorithm: 'pdq', hash: 'a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890', quality: 0.95 },
              { algorithm: 'md5', hash: 'a1b2c3d4e5f67890a1b2c3d4e5f67890' }
            ]
          };

          const mockSimilarImages: Image[] = [
            {
              id: 2,
              filename: 'photo2.jpg',
              uploadDate: '2025-03-09T14:31:00Z',
              url: '/api/images/photo2.jpg',
              hashes: [
                { algorithm: 'pdq', hash: 'b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1', quality: 0.92 }
              ]
            },
            {
              id: 3,
              filename: 'photo3.jpg',
              uploadDate: '2025-03-09T14:32:00Z',
              url: '/api/images/photo3.jpg',
              hashes: [
                { algorithm: 'pdq', hash: 'c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2', quality: 0.88 }
              ]
            }
          ];

          const mockMatches: Match[] = [
            {
              id: 1,
              algorithm: 'pdq',
              distance: 0.15,
              matchDate: '2025-03-09T14:30:05Z',
              matchedImageId: 2,
              matchedImageFilename: 'photo2.jpg'
            },
            {
              id: 2,
              algorithm: 'pdq',
              distance: 0.28,
              matchDate: '2025-03-09T14:30:10Z',
              matchedImageId: 3,
              matchedImageFilename: 'photo3.jpg'
            }
          ];

          setCurrentImage(mockCurrentImage);
          setSimilarImages(mockSimilarImages);
          setMatches(mockMatches);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
        toast({
          title: 'Error fetching data',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchData();
  }, [toast]);

  // Review action handlers
  const handleApprove = (id: number, notes: string) => {
    toast({
      title: 'Image Approved',
      description: notes ? `Notes: ${notes}` : 'No notes added',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    console.log('Approved', id, notes);
    // Move to next image
    loadNextImage();
  };

  const handleReject = (id: number, notes: string) => {
    toast({
      title: 'Image Rejected',
      description: notes ? `Notes: ${notes}` : 'No notes added',
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
    console.log('Rejected', id, notes);
    // Move to next image
    loadNextImage();
  };

  const handleEscalate = (id: number, notes: string) => {
    toast({
      title: 'Image Escalated',
      description: notes ? `Notes: ${notes}` : 'No notes added',
      status: 'warning',
      duration: 3000,
      isClosable: true,
    });
    console.log('Escalated', id, notes);
    // Move to next image
    loadNextImage();
  };

  const handleSkip = (id: number) => {
    toast({
      title: 'Image Skipped',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    console.log('Skipped', id);
    // Move to next image
    loadNextImage();
  };

  // Load next image (would be fetched from API in a real app)
  const loadNextImage = () => {
    setLoading(true);
    // Simulate API call with timeout
    setTimeout(() => {
      // This is just mock behavior - in a real app, you'd fetch a new image
      // For now, just reset to the same mock data
      setLoading(false);
    }, 1000);
  };

  return (
    <AppLayout>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading size="lg">Content Review</Heading>
          <HStack>
            <Text>Hash Algorithm:</Text>
            <Select 
              value={algorithm} 
              onChange={(e) => setAlgorithm(e.target.value)}
              width="120px"
            >
              <option value="pdq">PDQ</option>
              <option value="md5">MD5</option>
              <option value="sha1">SHA1</option>
            </Select>
          </HStack>
        </HStack>

        <Divider />

        {loading ? (
          <Text>Loading...</Text>
        ) : currentImage ? (
          <Grid
            templateColumns={{ base: "1fr", lg: "2fr 1fr" }}
            gap={6}
          >
            {/* Main content */}
            <GridItem>
              <VStack spacing={6} align="stretch">
                <Box position="relative">
                  <Badge 
                    position="absolute" 
                    top={2} 
                    right={2}
                    colorScheme="blue"
                    fontSize="sm"
                  >
                    Pending Review
                  </Badge>
                  <Box
                    borderRadius="md"
                    overflow="hidden"
                    boxShadow="md"
                    bg="gray.100"
                    height="500px"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                  >
                    {/* This would be a real image in production */}
                    <Box 
                      as="img"
                      src={`https://source.unsplash.com/random/800x600?sig=${currentImage.id}`} 
                      alt={currentImage.filename}
                      maxH="100%"
                      maxW="100%"
                      objectFit="contain"
                    />
                  </Box>
                </Box>

                <HStack>
                  <Text fontWeight="bold">Filename:</Text>
                  <Text>{currentImage.filename}</Text>
                </HStack>

                <Box>
                  <Text fontWeight="bold" mb={2}>Hash Information:</Text>
                  <Flex gap={2} wrap="wrap">
                    {currentImage.hashes.map((hash, index) => (
                      <Badge 
                        key={index} 
                        colorScheme={hash.algorithm === algorithm ? "green" : "gray"}
                        p={2}
                        borderRadius="md"
                      >
                        {hash.algorithm.toUpperCase()}: {hash.hash.substring(0, 8)}...{hash.hash.substring(hash.hash.length - 8)}
                        {hash.quality !== undefined && ` (Quality: ${hash.quality.toFixed(2)})`}
                      </Badge>
                    ))}
                  </Flex>
                </Box>

                <ReviewActions
                  imageId={currentImage.id}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEscalate={handleEscalate}
                  onSkip={handleSkip}
                  isProcessing={loading}
                />
              </VStack>
            </GridItem>

            {/* Sidebar - Similar Images & Match Details */}
            <GridItem>
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" mb={4}>Similar Images</Heading>
                  <VStack spacing={4} align="stretch">
                    {similarImages.map((image) => (
                      <ImageCard
                        key={image.id}
                        src={`https://source.unsplash.com/random/400x300?sig=${image.id}`}
                        alt={image.filename}
                        filename={image.filename}
                        uploadDate={image.uploadDate}
                        hashes={image.hashes}
                      />
                    ))}
                  </VStack>
                </Box>

                <Box>
                  <Heading size="md" mb={4}>Match Details</Heading>
                  <MatchDetails matches={matches} />
                </Box>
              </VStack>
            </GridItem>
          </Grid>
        ) : (
          <Text>No images pending review.</Text>
        )}
      </VStack>
    </AppLayout>
  );
} 