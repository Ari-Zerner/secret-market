import { NextRequest, NextResponse } from 'next/server';
import type { ManifoldAPIError } from '@/app/lib/db/types';
import CryptoJS from 'crypto-js';
import clientPromise from '@/app/lib/db/mongodb';
import type { StoredMarket } from '@/app/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const { description, apiKey, closeTime } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate hash of the description
    const descriptionHash = CryptoJS.SHA256(description).toString();

    // Create market title with hash
    const marketTitle = `Secret Market ${descriptionHash.substring(0, 8)}`;

    // Create market description
    const baseUrl = req.headers.get('host') || 'Secret Market Creator';
    const descriptionJson = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: `The SHA256 hash of this market's resolution criteria is ${descriptionHash}.`
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: `Created with https://${baseUrl}`
            }
          ]
        }
      ]
    });

    // Call Manifold API to create market
    const manifoldResponse = await fetch('https://api.manifold.markets/v0/market', {
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
      return NextResponse.json(
        { error: `Manifold API error: ${error.message || JSON.stringify(error)}` },
        { status: manifoldResponse.status }
      );
    }

    const market = await manifoldResponse.json();

    // Encrypt the description with the API key
    const encryptedDescription = CryptoJS.AES.encrypt(description, apiKey).toString();

    // Store the market data in MongoDB
    const mongoClient = await clientPromise;
    const db = mongoClient.db('secret-market');

    const storedMarket: StoredMarket = {
      id: market.id,
      encryptedDescription,
      descriptionHash,
      createdAt: new Date(),
      revealed: false
    };

    await db.collection('markets').insertOne(storedMarket);

    return NextResponse.json({
      id: market.id,
      title: marketTitle,
      descriptionHash
    });

  } catch (error) {
    console.error('Error creating market:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
