'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Spinner, Center } from '@chakra-ui/react';

// Redirect the root path to the dashboard
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  // Show a loading spinner while redirecting
  return (
    <Box h="100vh">
      <Center h="100%">
        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
      </Center>
    </Box>
  );
}
