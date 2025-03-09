'use client';

import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  FormLabel,
  Flex,
  VStack,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { QueueAPI } from '../../services/api';

interface BatchHashCheckProps {
  hashAlgorithms: string[];
  contentCategories: string[];
  getAlgorithmColor: (algorithm: string) => string;
  getCategoryColor: (category: string) => string;
}

const BatchHashCheck: React.FC<BatchHashCheckProps> = ({ 
  hashAlgorithms, 
  contentCategories,
  getAlgorithmColor,
  getCategoryColor
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasResults, setHasResults] = useState(false);
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };
  
  const handleAlgorithmChange = (algorithm: string) => {
    setSelectedAlgorithms(prev => {
      if (prev.includes(algorithm)) {
        return prev.filter(a => a !== algorithm);
      } else {
        return [...prev, algorithm];
      }
    });
  };
  
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one image file to upload",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (selectedAlgorithms.length === 0) {
      toast({
        title: "No algorithms selected",
        description: "Please select at least one hash algorithm",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Use a default category or first available category
      const defaultCategory = contentCategories.length > 0 ? contentCategories[0] : 'fowl_play';
      
      // Use the existing QueueAPI to submit batch images
      const batchResults = await QueueAPI.submitBatchImages(
        selectedFiles, 
        selectedAlgorithms,
        defaultCategory
      );
      
      setResults(batchResults);
      setHasResults(true);
      
      toast({
        title: "Upload Complete",
        description: `Successfully processed ${selectedFiles.length} image(s)`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error processing your files. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const clearSelection = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  return (
    <Box>
      <Card mb={6} variant="outline">
        <CardHeader>
          <Heading size="md">Batch Image Processing</Heading>
          <Text color="gray.600" fontSize="sm" mt={2}>
            Upload multiple images to process with HMA hash algorithms
          </Text>
        </CardHeader>
        <CardBody>
          <VStack spacing={6} align="stretch">
            {/* File upload section */}
            <Box>
              <FormLabel htmlFor="file-upload">Select Images</FormLabel>
              <Flex direction={{ base: "column", md: "row" }} gap={4}>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  ref={fileInputRef}
                />
                <Button 
                  colorScheme="blue" 
                  onClick={() => fileInputRef.current?.click()}
                  width={{ base: "100%", md: "auto" }}
                >
                  Choose Files
                </Button>
                {selectedFiles.length > 0 && (
                  <Text alignSelf="center">
                    {selectedFiles.length} file(s) selected
                  </Text>
                )}
                {selectedFiles.length > 0 && (
                  <Button 
                    variant="outline" 
                    colorScheme="red" 
                    onClick={clearSelection}
                    width={{ base: "100%", md: "auto" }}
                  >
                    Clear
                  </Button>
                )}
              </Flex>
              {selectedFiles.length > 0 && (
                <Box mt={4} maxH="200px" overflowY="auto" borderWidth="1px" borderRadius="md" p={2}>
                  {selectedFiles.map((file, index) => (
                    <Text key={index} fontSize="sm">
                      {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </Text>
                  ))}
                </Box>
              )}
            </Box>
            
            {/* Algorithm selection */}
            <Box>
              <FormLabel>Select Hash Algorithms</FormLabel>
              <Flex gap={4} flexWrap="wrap">
                {hashAlgorithms.map(algorithm => (
                  <Button
                    key={algorithm}
                    size="sm"
                    colorScheme={selectedAlgorithms.includes(algorithm) ? getAlgorithmColor(algorithm) : "gray"}
                    variant={selectedAlgorithms.includes(algorithm) ? "solid" : "outline"}
                    onClick={() => handleAlgorithmChange(algorithm)}
                  >
                    {algorithm.toUpperCase()}
                  </Button>
                ))}
              </Flex>
            </Box>
            
            {/* Submit button */}
            <Flex justifyContent="flex-end">
              <Button 
                colorScheme="green" 
                isLoading={isUploading}
                loadingText="Processing"
                onClick={handleUpload}
                isDisabled={selectedFiles.length === 0 || selectedAlgorithms.length === 0}
              >
                Upload and Process
              </Button>
            </Flex>
          </VStack>
        </CardBody>
      </Card>
      
      {/* Results section */}
      {hasResults && (
        <Card variant="outline">
          <CardHeader>
            <Heading size="md">Processing Results</Heading>
          </CardHeader>
          <CardBody>
            {results.map((result, index) => (
              <Box 
                key={index} 
                mb={4} 
                p={4} 
                borderWidth="1px" 
                borderRadius="md" 
                borderColor={result.matches ? "red.300" : "green.300"}
                bg={result.matches ? "red.50" : "green.50"}
                _dark={{
                  bg: result.matches ? "rgba(200, 30, 30, 0.1)" : "rgba(30, 200, 30, 0.1)",
                  borderColor: result.matches ? "red.500" : "green.500"
                }}
              >
                <Flex justifyContent="space-between" alignItems="center" mb={2}>
                  <Heading size="sm">{result.filename}</Heading>
                  <Badge colorScheme={result.matches ? "red" : "green"}>
                    {result.matches ? "Match Found" : "No Match"}
                  </Badge>
                </Flex>
                
                <Text fontSize="sm" mb={2}>
                  Size: {(result.size / (1024 * 1024)).toFixed(2)} MB | Uploaded: {
                    // Use ISO string format instead of locale-dependent formatting
                    new Date(result.uploadedAt).toISOString().replace('T', ' ').substring(0, 19)
                  }
                </Text>
                
                <Text fontSize="sm" mb={2}>
                  Category: <Badge colorScheme={getCategoryColor(result.category)}>{result.category}</Badge>
                </Text>
                
                <Text fontSize="sm" mb={2}>
                  Task ID: {result.taskId}
                </Text>
                
                <Text fontWeight="bold" mt={4} mb={2}>Applied Hash Algorithms:</Text>
                <Flex gap={2} flexWrap="wrap">
                  {result.hashAlgorithms.map((algo: string, i: number) => (
                    <Badge key={i} colorScheme={getAlgorithmColor(algo)} variant="outline" px={2} py={1}>
                      {algo.toUpperCase()}
                    </Badge>
                  ))}
                </Flex>
                
                {result.matches && result.matchDetails && result.matchDetails.length > 0 && (
                  <>
                    <Text fontWeight="bold" mt={4} mb={2}>Match Details:</Text>
                    {result.matchDetails.map((match: any, i: number) => (
                      <Box key={i} p={2} bg="white" _dark={{ bg: "gray.700" }} borderRadius="md" mb={2}>
                        <Text>Algorithm: <Badge colorScheme={getAlgorithmColor(match.algorithm)}>{match.algorithm.toUpperCase()}</Badge></Text>
                        <Text>Distance: {match.distance}</Text>
                        <Text>Match ID: {match.matchId}</Text>
                      </Box>
                    ))}
                  </>
                )}
                
                <Flex justifyContent="flex-end" mt={4}>
                  <Button 
                    colorScheme="blue" 
                    size="sm"
                    onClick={() => {
                      // Navigate to the review page with this task
                      // This would normally link to the task in the review queue
                      window.location.href = `/review?category=${result.category}`;
                    }}
                  >
                    View in Queue
                  </Button>
                </Flex>
              </Box>
            ))}
          </CardBody>
        </Card>
      )}
    </Box>
  );
};

export default BatchHashCheck; 