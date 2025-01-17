'use client';

import { useState } from 'react';
import CryptoJS from 'crypto-js';
import type { ManifoldAPIError } from '@/app/lib/db/types';
import { useRouter } from 'next/navigation';
import { APP_NAME, MANIFOLD_API_BASE } from './lib/constants';

export default function Home() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState(() => {
    // Only access localStorage after component mounts
    if (typeof window !== 'undefined') {
      return localStorage.getItem('manifoldApiKey') || '';
    }
    return '';
  });
  const [description, setDescription] = useState('');
  const [closeTime, setCloseTime] = useState(() => {
    // Default to one week from now
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    return oneWeekFromNow.toISOString().slice(0, 16); // Format: "YYYY-MM-DDThh:mm"
  });
  const [marketUrl, setMarketUrl] = useState('');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');

  const createMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Generate hash of the description
      const descriptionHash = CryptoJS.SHA256(description).toString();

      // Create market title with hash
      const marketTitle = `Secret Market ${descriptionHash.substring(0, 8)}`;

      // Encrypt the description with the password or API key
      const encryptionKey = password || apiKey;
      const encryptedDescription = CryptoJS.AES.encrypt(description, encryptionKey).toString();

      // Create market description
      const descriptionContent = [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: `The SHA256 hash of this market's resolution criteria is ${descriptionHash}.`
            }
          ]
        }
      ];

      if (password) {
        // If using password, include the encrypted description in the market description
        descriptionContent.push(
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Resolution criteria (AES encrypted): ' + encryptedDescription
              }
            ]
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'To decrypt: Use CryptoJS.AES.decrypt(ciphertext, password).toString(CryptoJS.enc.Utf8)'
              }
            ]
          }
        );
      }

      descriptionContent.push({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: `Created with ${window.location.origin}`
          }
        ]
      });

      const descriptionJson = JSON.stringify({
        type: 'doc',
        content: descriptionContent
      });

      // Call Manifold API to create market
      const manifoldResponse = await fetch(`${MANIFOLD_API_BASE}/market`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${apiKey}`
        },
        body: JSON.stringify({
          outcomeType: 'BINARY',
          question: marketTitle,
          descriptionJson,
          initialProb: 50,
          closeTime: new Date(closeTime).getTime(),
          visibility: 'unlisted'
        })
      });

      if (!manifoldResponse.ok) {
        const error = await manifoldResponse.json();
        console.error('Manifold API error:', {
          endpoint: '/market',
          status: manifoldResponse.status,
          error,
          details: (error as ManifoldAPIError).details
        });
        throw new Error(`Manifold API error: ${error.message || JSON.stringify(error)}`);
      }

      const market = await manifoldResponse.json();

      // If using password, encrypt it with API key for storage
      const encryptedPassword = password 
        ? CryptoJS.AES.encrypt(password, apiKey).toString()
        : undefined;

      // Store the encrypted data in MongoDB
      const dbResponse = await fetch('/api/market', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: market.id,
          encryptedDescription,
          descriptionHash,
          encryptedPassword
        }),
      });

      if (!dbResponse.ok) {
        throw new Error('Failed to store market data');
      }

      router.push(`/market/${market.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const navigateToMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Extract market slug from URL
      const marketSlug = marketUrl.match(/([^\/]+)\/?$/)?.[1];
      if (!marketSlug) {
        throw new Error(`Invalid Manifold market URL`);
      }

      // Verify market exists
      const response = await fetch(`https://api.manifold.markets/v0/slug/${marketSlug}`);
      if (!response.ok) {
        throw new Error(`Market not found`);
      }

      const market = await response.json();

      router.push(`/market/${market.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load market');
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 max-w-3xl mx-auto">
      <header className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{APP_NAME}</h1>
        <p className="text-gray-900 dark:text-gray-100 max-w-xl mx-auto leading-relaxed">
          Create Manifold markets with hidden resolution criteria.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Create New Market</h2>
          <form onSubmit={createMarket} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Manifold API Key
                <span className="text-gray-600 dark:text-gray-400 ml-1 text-xs font-normal">
                  (from your Manifold account settings)
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
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Optional Password
                <span className="text-gray-600 dark:text-gray-400 ml-1 text-xs font-normal">
                  (for decrypting resolution criteria)
                </span>
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded-lg bg-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Leave blank to use API key"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Close Time
                <span className="text-gray-600 dark:text-gray-400 ml-1 text-xs font-normal">
                  (when betting will end)
                </span>
              </label>
              <input
                type="datetime-local"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="w-full p-3 border rounded-lg bg-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Secret Resolution Criteria
                <span className="text-gray-600 dark:text-gray-400 ml-1 text-xs font-normal">
                  (will be hashed)
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border rounded-lg bg-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition h-32"
                required
                placeholder="Enter the secret criteria for resolving this market..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition font-medium"
            >
              Create Secret Market
            </button>
          </form>
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">View Existing Market</h2>
            <form onSubmit={navigateToMarket} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5">
                  Manifold Market URL
                </label>
                <input
                  type="url"
                  value={marketUrl}
                  onChange={(e) => setMarketUrl(e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                  placeholder="https://manifold.markets/..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gray-100 text-gray-700 p-3 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                View Market
              </button>
            </form>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-3 dark:text-gray-100">How It Works</h2>
            <ol className="list-decimal list-inside space-y-2.5 text-sm text-gray-900 dark:text-gray-100">
              <li>Enter your market details and secret resolution criteria</li>
              <li>We create a hash of your resolution criteria</li>
              <li>A market is created on Manifold (with you as the creator) with the hash as proof</li>
              <li>We store the resolution criteria securely, encrypted in-browser with your API key</li>
              <li>When ready, you can reveal the criteria and resolve the market</li>
            </ol>
          </div>
        </section>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
          <p className="font-semibold text-red-800 dark:text-red-200">Error</p>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
        </div>
      )}
    </div>
  );
}
