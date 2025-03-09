'use client';

import { ChakraProvider as ChakraProviderComponent, extendTheme } from '@chakra-ui/react';

// Extend the theme with custom colors, fonts, etc.
const theme = extendTheme({
  fonts: {
    heading: "var(--font-geist-sans)",
    body: "var(--font-geist-sans)",
    mono: "var(--font-geist-mono)",
  },
  colors: {
    brand: {
      50: "#eef2ff",
      100: "#e0e7ff",
      500: "#6366f1",
      600: "#4f46e5",
      700: "#4338ca",
      800: "#3730a3",
      900: "#312e81",
    },
  },
});

export function ChakraProvider({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProviderComponent theme={theme}>
      {children}
    </ChakraProviderComponent>
  );
} 