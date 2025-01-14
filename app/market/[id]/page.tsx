'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function MarketPage() {
  const params = useParams();
  const marketId = params.id as string;

  const [apiKey, setApiKey] = useState(() => {
    // Only access localStorage after component mounts
    if (typeof window !== 'undefined') {
      return localStorage.getItem('manifoldApiKey') || '';
    }
    return '';
  });
  const [actionError, setActionError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [market, setMarket] = useState<{
    id: string;
    title: string;
    descriptionHash: string;
    manifoldUrl: string;
  } | null>(null);
  const [revealedDescription, setRevealedDescription] = useState<string>('');

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        // First check our database
        const dbResponse = await fetch(`/api/market/${marketId}`);
        if (!dbResponse.ok) {
          if (dbResponse.status === 404) {
            throw new Error('This market does not exist or was not created with Secret Market');
          }
          throw new Error('Failed to load market');
        }
        const dbData = await dbResponse.json();

        // Then get additional info from Manifold
        const manifoldResponse = await fetch(`https://api.manifold.markets/v0/market/${marketId}`);
        if (!manifoldResponse.ok) {
          const errorData = await manifoldResponse.json();
          throw new Error(`Manifold API error: ${errorData.message || JSON.stringify(errorData)}`);
        }
        const manifoldData = await manifoldResponse.json();

        setMarket({
          id: marketId,
          title: manifoldData.question,
          descriptionHash: dbData.descriptionHash,
          manifoldUrl: manifoldData.url
        });
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load market');
      }
    };

    if (marketId) {
      fetchMarket();
    }
  }, [marketId]);

  const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen p-6 md:p-8 max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-block mb-6 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
      >
        ← Back to Home
      </Link>
      {children}
    </div>
  );

  // Show load error at top of page if market failed to load
  const LoadError = () => loadError ? (
    <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
      <p className="font-semibold text-red-800 dark:text-red-200">Error Loading Market</p>
      <p className="text-sm text-red-700 dark:text-red-300 mt-1">{loadError}</p>
    </div>
  ) : null;

  if (!market) {
    return (
      <PageWrapper>
        <div className="text-center">Loading...</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <LoadError />
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-3">{market.title}</h1>
        <a
          href={market.manifoldUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View on Manifold →
        </a>
      </header>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-3 dark:text-gray-100">Market Details</h2>
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-medium">Market ID: </span>
              <code className="bg-gray-100 dark:bg-gray-900/30 px-2 py-1 rounded">{market.id}</code>
            </p>
            <p>
              <span className="font-medium">Description Hash: </span>
              <code className="bg-gray-100 dark:bg-gray-900/30 px-2 py-1 rounded break-all">
                {market.descriptionHash}
              </code>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-3 dark:text-gray-100">Reveal Options</h2>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const response = await fetch(`/api/market/${market.id}`, {
                  headers: {
                    'x-api-key': apiKey
                  }
                });

                if (!response.ok) {
                  throw new Error('Failed to reveal description');
                }

                const data = await response.json();
                setRevealedDescription(data.description);
              } catch (err) {
                setActionError(err instanceof Error ? err.message : 'Failed to reveal description');
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Manifold API Key
                <span className="text-gray-600 dark:text-gray-400 ml-1 text-xs font-normal">
                  (required to decrypt resolution criteria)
                </span>
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onBlur={(e) => localStorage.setItem('manifoldApiKey', e.target.value)}
                className="w-full p-3 border rounded-lg bg-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
              {actionError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{actionError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!apiKey}
              className="w-full bg-gray-100 text-gray-700 p-3 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50"
            >
              View Resolution Criteria
            </button>

            {revealedDescription && (
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-semibold mb-2 dark:text-gray-100">Secret Description:</p>
                    <p className="text-gray-900 dark:text-gray-100">{revealedDescription}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(revealedDescription);
                      setActionError('Copied to clipboard!');
                      setTimeout(() => setActionError(''), 2000);
                    }}
                    className="shrink-0 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
