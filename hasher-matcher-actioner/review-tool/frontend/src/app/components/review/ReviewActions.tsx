import { ButtonGroup, Button, Textarea, VStack, useColorModeValue, Box, Heading, SimpleGrid } from "@chakra-ui/react";
import { CheckIcon, CloseIcon, WarningIcon, ArrowForwardIcon } from "@chakra-ui/icons";
import { useState } from "react";

interface ReviewActionsProps {
  imageId: number;
  onApprove: (id: number, notes: string) => void;
  onReject: (id: number, notes: string) => void;
  onEscalate: (id: number, notes: string) => void;
  onSkip: (id: number) => void;
  isProcessing?: boolean;
}

export default function ReviewActions({
  imageId,
  onApprove,
  onReject,
  onEscalate,
  onSkip,
  isProcessing = false
}: ReviewActionsProps) {
  const [notes, setNotes] = useState("");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const bgColor = useColorModeValue("white", "gray.700");

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      p={4}
      bg={bgColor}
    >
      <VStack spacing={4} align="stretch">
        <Heading size="sm">Review Actions</Heading>
        
        <Textarea
          placeholder="Optional notes about this review decision..."
          size="sm"
          resize="vertical"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        
        <SimpleGrid columns={2} spacing={2}>
          <Button
            leftIcon={<CheckIcon />}
            colorScheme="green"
            onClick={() => onApprove(imageId, notes)}
            isDisabled={isProcessing}
            size="md"
          >
            Approve
          </Button>
          <Button
            leftIcon={<CloseIcon />}
            colorScheme="red"
            onClick={() => onReject(imageId, notes)}
            isDisabled={isProcessing}
            size="md"
          >
            Reject
          </Button>
          <Button
            leftIcon={<WarningIcon />}
            colorScheme="orange"
            onClick={() => onEscalate(imageId, notes)}
            isDisabled={isProcessing}
            size="md"
          >
            Escalate
          </Button>
          <Button
            leftIcon={<ArrowForwardIcon />}
            colorScheme="gray"
            onClick={() => onSkip(imageId)}
            isDisabled={isProcessing}
            size="md"
          >
            Skip
          </Button>
        </SimpleGrid>
      </VStack>
    </Box>
  );
} 