'use client';

import React, { useState } from 'react';
import NearestMatches from '../components/NearestMatches';
import ImageComparison from '../components/ImageComparison';

export default function NearestMatchesPage() {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const handleShowDifferences = (matchId: string) => {
    setSelectedMatchId(matchId);
  };

  const handleImagesSelected = async (image1: File, image2: File) => {
    // Handle image comparison if needed
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Nearest Matches Explorer
      </h1>

      <div className="mb-8">
        <NearestMatches onShowDifferences={handleShowDifferences} />
      </div>

      {selectedMatchId && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">
            Comparing with Match #{selectedMatchId}
          </h2>
          <ImageComparison 
            onImagesSelected={handleImagesSelected}
            matchId={selectedMatchId}
          />
        </div>
      )}
    </main>
  );
} 