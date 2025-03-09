import { Box, Container, useColorModeValue } from "@chakra-ui/react";
import NavBar from "./NavBar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const bgColor = useColorModeValue("gray.50", "gray.900");

  return (
    <Box minH="100vh" bg={bgColor}>
      <NavBar />
      <Container maxW="container.xl" pt="20" pb="8">
        {children}
      </Container>
    </Box>
  );
} 