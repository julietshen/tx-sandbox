import { Box, Flex, Heading, Button, HStack, useColorModeValue, useColorMode } from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import Link from "next/link";

export default function NavBar() {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      as="nav"
      position="fixed"
      w="100%"
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      px={4}
      zIndex="banner"
    >
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <HStack spacing={8} alignItems="center">
          <Heading as="h1" size="md">
            <Link href="/">HMA Review Tool</Link>
          </Heading>
          <HStack as="nav" spacing={4} display={{ base: "none", md: "flex" }}>
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/review">
              <Button variant="ghost">Review Queue</Button>
            </Link>
            <Link href="/upload">
              <Button variant="ghost">Upload</Button>
            </Link>
          </HStack>
        </HStack>
        <Flex alignItems="center">
          <Button onClick={toggleColorMode} size="md" variant="ghost">
            {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
} 