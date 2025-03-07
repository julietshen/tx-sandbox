import React, { useState } from 'react';

interface Match {
  id: number;
  distance: number;
  metadata: Record<string, any>;
}

interface NearestMatchesProps {
  onShowDifferences: (hash: string) => void;
}

export default function NearestMatches({ onShowDifferences }: NearestMatchesProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRandomHash = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/random_hash');
      if (!response.ok) {
        throw new Error('Failed to get random hash');
      }
      const data = await response.json();
      findNearestMatches(null, null, data.hash);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get random hash');
    }
  };

  const findNearestMatches = async (
    image: File | null = null,
    base64Image: string | null = null,
    hashValue: string | null = null
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (image) {
        formData.append('image', image);
      } else if (base64Image) {
        formData.append('base64_image', base64Image);
      } else if (hashValue) {
        formData.append('hash_value', hashValue);
      }

      const response = await fetch('http://localhost:8000/find_nearest', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to find nearest matches');
      }

      const data = await response.json();
      setMatches(data.matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedFile) {
      await findNearestMatches(selectedFile, null, null);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Find Nearest Matches</h2>
      
      <div className="flex gap-4 mb-8">
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Upload an image
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="mt-1 block w-full text-sm text-gray-500
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={!selectedFile || isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded
                     hover:bg-blue-600 disabled:opacity-50
                     disabled:cursor-not-allowed"
          >
            Find Matches
          </button>
        </form>

        <div className="flex-1">
          <button
            onClick={handleRandomHash}
            disabled={isLoading}
            className="bg-green-500 text-white px-4 py-2 rounded
                     hover:bg-green-600 disabled:opacity-50
                     disabled:cursor-not-allowed"
          >
            Use Random Previous Image
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center text-gray-600">
          Finding matches...
        </div>
      )}

      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {matches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">
            Found {matches.length} matches
          </h3>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <div
                key={match.id}
                className="p-4 border rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Match #{match.id}</span>
                  <span className="text-sm text-gray-500">
                    Distance: {match.distance.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => onShowDifferences(match.id.toString())}
                  className="w-full mt-2 bg-blue-100 text-blue-700 px-3 py-1
                           rounded hover:bg-blue-200 transition-colors"
                >
                  Show Differences
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 