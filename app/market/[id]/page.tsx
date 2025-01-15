'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ManifoldAPIError } from '@/app/lib/db/types';

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

const LoadError = ({ message }: { message: string }) => message ? (
  <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
    <p className="font-semibold text-red-800 dark:text-red-200">Error Loading Market</p>
    <p className="text-sm text-red-700 dark:text-red-300 mt-1">{message}</p>
  </div>
) : null;

export default function MarketPage() {
  const params = useParams();
  const marketId = params.id as string;

  const [apiKey, setApiKey] = useState(() => {
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
    isResolved: boolean;
    resolution?: 'YES' | 'NO' | 'MKT' | 'CANCEL';
    resolutionProbability?: number;
  } | null>(null);
  const [revealedDescription, setRevealedDescription] = useState<string>('');

  useEffect(() => {
    let isSubscribed = true;
    
    const fetchMarket = async () => {
      try {
        setLoadError('');
        
        const dbResponse = await fetch(`/api/market/${marketId}`);
        if (!dbResponse.ok) {
          if (dbResponse.status === 404) {
            throw new Error('This market does not exist or was not created with Secret Market');
          }
          throw new Error('Failed to load market');
        }
        const dbData = await dbResponse.json();

        const manifoldResponse = await fetch(`https://api.manifold.markets/v0/market/${marketId}`);
        if (!manifoldResponse.ok) {
          const errorData = await manifoldResponse.json();
          console.error('Manifold API error:', {
            endpoint: `/market/${marketId}`,
            status: manifoldResponse.status,
            error: errorData,
            details: (errorData as ManifoldAPIError).details
          });
          throw new Error(`Manifold API error: ${errorData.message || JSON.stringify(errorData)}`);
        }
        const manifoldData = await manifoldResponse.json();

        if (isSubscribed) {
          setMarket({
            id: marketId,
            title: manifoldData.question,
            descriptionHash: dbData.descriptionHash,
            manifoldUrl: manifoldData.url,
            isResolved: manifoldData.isResolved,
            resolution: manifoldData.resolution,
            resolutionProbability: manifoldData.resolutionProbability
          });
        }
      } catch (err) {
        if (isSubscribed) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load market');
          setMarket(null);
        }
      }
    };

    if (marketId) {
      fetchMarket();
    }

    return () => {
      isSubscribed = false;
    };
  }, [marketId]);

  if (!market && !loadError) {
    return (
      <PageWrapper>
        <div className="text-center">
          <div className="animate-pulse">Loading market details...</div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <LoadError message={loadError} />
      {market && (
        <>
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
                <p>
                  <span className="font-medium">Status: </span>
                  
                  <code className="bg-gray-100 dark:bg-gray-900/30 px-2 py-1 rounded">
                    {market.isResolved ? (
                      <>
                        Resolved to{' '}
                        {market.resolution === 'CANCEL' ? 'N/A' : market.resolution}
                        {market.resolution === 'MKT' && market.resolutionProbability !== undefined
                          ? ` (${market.resolutionProbability}%)`
                          : ''}
                      </>
                    ) : (
                      'Unresolved'
                    )}
                  </code>
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-3 dark:text-gray-100">Market Actions</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">
                    Manifold API Key
                    <span className="text-gray-600 dark:text-gray-400 ml-1 text-xs font-normal">
                      (required for market actions)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      localStorage.setItem('manifoldApiKey', e.target.value);
                    }}
                    className="w-full p-3 border rounded-lg bg-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                  {actionError && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{actionError}</p>
                  )}
                </div>

                <button
                  onClick={async () => {
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
                  disabled={!apiKey || !!revealedDescription}
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

                {!market.isResolved && revealedDescription && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const formData = new FormData(form);
                    const resolution = formData.get('resolution') as string;
                    const probability = formData.get('probability') as string;
                    const revealDescription = formData.get('revealDescription') === 'true';

                    try {
                      setActionError('');

                      // Resolve the market
                      const resolveResponse = await fetch(`https://api.manifold.markets/v0/market/${market.id}/resolve`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Key ${apiKey}`
                        },
                        body: JSON.stringify({
                          outcome: resolution,
                          ...(resolution === 'MKT' && probability ? { probabilityInt: parseInt(probability, 10) } : {})
                        })
                      });

                      if (!resolveResponse.ok) {
                        const error = await resolveResponse.json();
                        console.error('Manifold API error:', {
                          endpoint: `/market/${market.id}/resolve`,
                          status: resolveResponse.status,
                          error,
                          details: (error as ManifoldAPIError).details
                        });
                        throw new Error(`Failed to resolve market: ${error.message || JSON.stringify(error)}`);
                      }

                      // If user wants to reveal description, do that too
                      if (revealDescription && revealedDescription) {
                        const commentResponse = await fetch(`https://api.manifold.markets/v0/comment`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Key ${apiKey}`
                          },
                          body: JSON.stringify({
                            contractId: market.id,
                            content: {
                              type: 'doc',
                              content: [
                                {
                                  type: 'paragraph',
                                  content: [
                                    {
                                      type: 'text',
                                      marks: [
                                        {
                                          type: 'bold'
                                        }
                                      ],
                                      text: 'Resolution Criteria'
                                    }
                                  ]
                                },
                                {
                                  type: 'paragraph',
                                  content: [
                                    {
                                      type: 'text',
                                      text: revealedDescription
                                    }
                                  ]
                                }
                              ]
                            }
                          })
                        });

                        if (!commentResponse.ok) {
                          const error = await commentResponse.json();
                          console.error('Manifold API error:', {
                            endpoint: '/comment',
                            status: commentResponse.status,
                            error,
                            details: (error as ManifoldAPIError).details
                          });
                          throw new Error(`Failed to post comment: ${error.message || JSON.stringify(error)}`);
                        }
                      }

                      // Refresh the page to show new resolution status
                      window.location.reload();
                    } catch (err) {
                      setActionError(err instanceof Error ? err.message : 'Failed to resolve market');
                    }
                  }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5">Resolution</label>
                      <select
                        name="resolution"
                        className="w-full p-3 border rounded-lg bg-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        required
                        onChange={(e) => {
                          const form = e.target.form;
                          if (form) {
                            const probabilityInput = form.elements.namedItem('probability') as HTMLInputElement;
                            if (probabilityInput) {
                              probabilityInput.disabled = e.target.value !== 'MKT';
                            }
                          }
                        }}
                      >
                        <option value="">Select resolution...</option>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                        <option value="MKT">PROB</option>
                        <option value="CANCEL">N/A</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-1.5">
                        Probability (%)
                        <span className="text-gray-600 dark:text-gray-400 ml-1 text-xs font-normal">
                          (only for PROB resolution; leave blank for market probability)
                        </span>
                      </label>
                      <input
                        type="number"
                        name="probability"
                        min="0"
                        max="100"
                        disabled
                        className="w-full p-3 border rounded-lg bg-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:opacity-50"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="revealDescription"
                        value="true"
                        id="revealDescription"
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="revealDescription" className="text-sm">
                        Reveal resolution criteria in comment
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={!apiKey}
                      className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-50"
                    >
                      Resolve Market
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  );
}
