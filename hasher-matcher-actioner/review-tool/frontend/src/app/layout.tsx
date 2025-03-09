import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

export const metadata: Metadata = {
  title: "HMA Review Tool",
  description: "Content moderation review tool for Hasher-Matcher-Actioner (HMA)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ChakraProvider theme={theme}>
          {children}
        </ChakraProvider>
      </body>
    </html>
  );
}
