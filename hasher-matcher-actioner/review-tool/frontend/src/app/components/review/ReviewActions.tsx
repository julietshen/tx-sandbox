import { ButtonGroup, Button, Textarea, VStack, useColorModeValue, Box, Heading, SimpleGrid, Text, Tooltip } from "@chakra-ui/react";
import { CheckIcon, CloseIcon, WarningIcon, ArrowForwardIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useState } from "react";

interface ReviewActionsProps {
  imageId: number;
  onApprove: (id: number, notes: string) => void;
  onReject: (id: number, notes: string) => void;
  onEscalate: (id: number, notes: string) => void;
  onSkip: (id: number) => void;
  isProcessing?: boolean;
  tasksRemaining?: boolean;
}

export default function ReviewActions({
  imageId,
  onApprove,
  onReject,
  onEscalate,
  onSkip,
  isProcessing = false,
  tasksRemaining = true
}: ReviewActionsProps) {
  const [notes, setNotes] = useState("");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const bgColor = useColorModeValue("white", "gray.700");
  const hintColor = useColorModeValue("gray.500", "gray.400");

  const nextIcon = <ChevronRightIcon ml={1} />;

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
        
        {tasksRemaining && (
          <Text fontSize="sm" color={hintColor}>
            All actions will move to the next task in the queue
          </Text>
        )}
        
        <Textarea
          placeholder="Optional notes about this review decision..."
          size="sm"
          resize="vertical"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        
        <SimpleGrid columns={2} spacing={2}>
          <Tooltip label="Approve this content and move to next task">
            <Button
              leftIcon={<CheckIcon />}
              rightIcon={tasksRemaining ? nextIcon : undefined}
              colorScheme="green"
              onClick={() => onApprove(imageId, notes)}
              isDisabled={isProcessing}
              size="md"
            >
              Approve
            </Button>
          </Tooltip>
          <Tooltip label="Reject this content and move to next task">
            <Button
              leftIcon={<CloseIcon />}
              rightIcon={tasksRemaining ? nextIcon : undefined}
              colorScheme="red"
              onClick={() => onReject(imageId, notes)}
              isDisabled={isProcessing}
              size="md"
            >
              Reject
            </Button>
          </Tooltip>
          <Tooltip label="Escalate this content and move to next task">
            <Button
              leftIcon={<WarningIcon />}
              rightIcon={tasksRemaining ? nextIcon : undefined}
              colorScheme="orange"
              onClick={() => onEscalate(imageId, notes)}
              isDisabled={isProcessing}
              size="md"
            >
              Escalate
            </Button>
          </Tooltip>
          <Tooltip label="Skip this task without a decision">
            <Button
              leftIcon={<ArrowForwardIcon />}
              colorScheme="gray"
              onClick={() => onSkip(imageId)}
              isDisabled={isProcessing}
              size="md"
            >
              Skip
            </Button>
          </Tooltip>
        </SimpleGrid>
      </VStack>
    </Box>
  );
} 