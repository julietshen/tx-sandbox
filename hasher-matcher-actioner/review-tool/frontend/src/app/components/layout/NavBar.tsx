'use client';

import { 
  Box, 
  Flex, 
  Heading, 
  Button, 
  HStack, 
  useColorModeValue, 
  useColorMode,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  IconButton,
  useDisclosure,
  Divider,
  Text
} from "@chakra-ui/react";
import { MoonIcon, SunIcon, HamburgerIcon } from "@chakra-ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <>
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
          <HStack spacing={4} alignItems="center">
            <IconButton
              aria-label="Open menu"
              icon={<HamburgerIcon />}
              variant="ghost"
              onClick={onOpen}
              display={{ base: "flex", md: "flex" }}
            />
            <Heading as="h1" size="md">
              <Link href="/">HMA Demo Tool</Link>
            </Heading>
          </HStack>
          <Flex alignItems="center">
            <Button onClick={toggleColorMode} size="md" variant="ghost">
              {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
            </Button>
          </Flex>
        </Flex>
      </Box>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            Navigation
          </DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={4} mt={4}>
              <Text fontWeight="bold" fontSize="sm" color="gray.500">MAIN</Text>
              <Link href="/dashboard">
                <Button 
                  variant={isActive('/dashboard') ? "solid" : "ghost"} 
                  colorScheme={isActive('/dashboard') ? "blue" : undefined}
                  justifyContent="flex-start" 
                  width="100%"
                >
                  Dashboard
                </Button>
              </Link>
              
              <Divider />
              
              <Text fontWeight="bold" fontSize="sm" color="gray.500">DEMO FEATURES</Text>
              <Link href="/demo/compare">
                <Button 
                  variant={isActive('/demo/compare') ? "solid" : "ghost"} 
                  colorScheme={isActive('/demo/compare') ? "blue" : undefined}
                  justifyContent="flex-start" 
                  width="100%"
                >
                  Image Comparison
                </Button>
              </Link>
              <Link href="/demo/search">
                <Button 
                  variant={isActive('/demo/search') ? "solid" : "ghost"} 
                  colorScheme={isActive('/demo/search') ? "blue" : undefined}
                  justifyContent="flex-start" 
                  width="100%"
                >
                  Similarity Search
                </Button>
              </Link>
              
              <Divider />
              
              <Text fontWeight="bold" fontSize="sm" color="gray.500">REVIEW TOOLS</Text>
              <Link href="/review">
                <Button 
                  variant={isActive('/review') ? "solid" : "ghost"} 
                  colorScheme={isActive('/review') ? "blue" : undefined}
                  justifyContent="flex-start" 
                  width="100%"
                >
                  Review
                </Button>
              </Link>
              <Link href="/tasks">
                <Button 
                  variant={isActive('/tasks') ? "solid" : "ghost"} 
                  colorScheme={isActive('/tasks') ? "blue" : undefined}
                  justifyContent="flex-start" 
                  width="100%"
                >
                  Tasks
                </Button>
              </Link>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
} 