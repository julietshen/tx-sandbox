'use client';

import { Box } from '@chakra-ui/react';
import AppLayout from '../../components/layout/AppLayout';
import dynamic from 'next/dynamic';

// Import SimilaritySearchDemo as a client-only component with no SSR
const SimilaritySearchDemo = dynamic(
  () => import('../../components/demo/SimilaritySearchDemo'),
  { ssr: false }
);

export default function SimilaritySearchPage() {
  return (
    <AppLayout>
      <Box>
        <SimilaritySearchDemo />
      </Box>
    </AppLayout>
  );
} 