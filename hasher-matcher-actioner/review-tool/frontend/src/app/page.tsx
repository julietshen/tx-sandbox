'use client';

import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  Button, 
  VStack, 
  HStack, 
  Image, 
  SimpleGrid, 
  Card, 
  CardBody, 
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import Link from 'next/link';
import { MdCompareArrows, MdSearch, MdDashboard } from 'react-icons/md';

export default function Home() {
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, white)',
    'linear(to-b, gray.900, gray.800)'
  );
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box>
      <Box 
        py={20} 
        bgGradient={bgGradient}
      >
        <Container maxW="container.xl">
          <VStack spacing={8} align="center" textAlign="center">
            <Heading as="h1" size="2xl">
              Hasher-Matcher-Actioner Demo
            </Heading>
            <Text fontSize="xl" maxW="800px">
              This demo showcases the core functionality of Meta's Hasher-Matcher-Actioner (HMA) framework for content moderation and similarity detection.
            </Text>
            <Text fontSize="md" maxW="800px" color="gray.500">
              HMA is a reference implementation for copy detection in trust and safety applications, allowing platforms to identify identical or similar content to previously identified items.
            </Text>
            <HStack spacing={4} pt={4}>
              <Link href="/demo/compare">
                <Button size="lg" colorScheme="blue" leftIcon={<MdCompareArrows />}>
                  Try Image Comparison
                </Button>
              </Link>
              <Link href="/demo/search">
                <Button size="lg" variant="outline" leftIcon={<MdSearch />}>
                  Try Similarity Search
                </Button>
              </Link>
            </HStack>
          </VStack>
        </Container>
      </Box>

      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Heading as="h2" size="xl" mb={8}>
            Core HMA Features
          </Heading>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} width="100%">
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
              <CardBody>
                <VStack spacing={4} align="flex-start">
                  <Icon as={MdCompareArrows} boxSize={10} color="blue.500" />
                  <Heading size="md">PDQ Image Comparison</Heading>
                  <Text>
                    Compare two images using PDQ (Perceptual Difference Quantization), a perceptual hash for detecting similar images regardless of minor modifications.
                  </Text>
                  <Link href="/demo/compare">
                    <Button variant="link" colorScheme="blue">
                      Try it now →
                    </Button>
                  </Link>
                </VStack>
              </CardBody>
            </Card>

            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
              <CardBody>
                <VStack spacing={4} align="flex-start">
                  <Icon as={MdSearch} boxSize={10} color="blue.500" />
                  <Heading size="md">Similarity Search</Heading>
                  <Text>
                    Find similar images in the database using PDQ hashing to identify visually similar content, a key capability of the HMA framework.
                  </Text>
                  <Link href="/demo/search">
                    <Button variant="link" colorScheme="blue">
                      Try it now →
                    </Button>
                  </Link>
                </VStack>
              </CardBody>
            </Card>

            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
              <CardBody>
                <VStack spacing={4} align="flex-start">
                  <Icon as={MdDashboard} boxSize={10} color="blue.500" />
                  <Heading size="md">Content Moderation</Heading>
                  <Text>
                    Explore how HMA can be integrated into a content moderation workflow to identify and manage potentially harmful content.
                  </Text>
                  <Link href="/dashboard">
                    <Button variant="link" colorScheme="blue">
                      View dashboard →
                    </Button>
                  </Link>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          <Box mt={12} p={6} borderWidth="1px" borderColor={borderColor} borderRadius="lg" bg={cardBg}>
            <VStack spacing={4}>
              <Heading size="md">About Hasher-Matcher-Actioner</Heading>
              <Text textAlign="center" maxW="800px">
                Hasher-Matcher-Actioner (HMA) is Meta's open-source framework for content moderation through copy detection.
                It enables platforms to identify identical or similar content to previously identified items using hashing technologies.
                Learn more about HMA on the <a href="https://github.com/facebook/ThreatExchange/tree/main/hasher-matcher-actioner" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>GitHub repository</a>.
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
