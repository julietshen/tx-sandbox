'use client';

import { Box } from '@chakra-ui/react';
import AppLayout from '../../components/layout/AppLayout';
import dynamic from 'next/dynamic';

// Import ImageComparisonDemo as a client-only component with no SSR
const ImageComparisonDemo = dynamic(
  () => import('../../components/demo/ImageComparisonDemo'),
  { ssr: false }
);

export default function ImageComparisonPage() {
  return (
    <AppLayout>
      <Box>
        <ImageComparisonDemo />
      </Box>
    </AppLayout>
  );
} 