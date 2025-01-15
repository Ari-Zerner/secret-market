import { NextRequest, NextResponse } from 'next/server';
import type { ManifoldAPIError } from '@/app/lib/db/types';
import CryptoJS from 'crypto-js';
import clientPromise from '@/app/lib/db/mongodb';

export async function GET(
  request: NextRequest
) {
  const { id } = request.nextUrl.pathname.match(/\/market\/(?<id>[^\/]+)/)?.groups ?? {};
  try {
    const apiKey = request.headers.get('x-api-key');

    const mongoClient = await clientPromise;
    const db = mongoClient.db('secret-market');

    const market = await db.collection('markets').findOne({ id: id });

    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }

    // If API key is provided, decrypt and return description
    if (apiKey) {
      const bytes = CryptoJS.AES.decrypt(market.encryptedDescription, apiKey);
        const description = bytes.toString(CryptoJS.enc.Utf8);

        if (!description) {
          return NextResponse.json(
            { error: 'Invalid API key' },
            { status: 401 }
          );
        }

        return NextResponse.json({ description });
    }

    // Otherwise just return public info
    return NextResponse.json({
      id: market.id,
      descriptionHash: market.descriptionHash,
      revealed: market.revealed
    });

  } catch (error) {
    console.error('Error revealing market:', error instanceof Error ? {
      message: error.message,
      details: (error as ManifoldAPIError).details
    } : error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  const { id } = request.nextUrl.pathname.match(/\/market\/(?<id>[^\/]+)/)?.groups ?? {};
  try {
    const { apiKey } = await request.json();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401 }
      );
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db('secret-market');

    const market = await db.collection('markets').findOne({ id });

    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }

    // Rest of the function stays the same...
  } catch (error) {
    console.error('Error revealing market:', error, {          details: (error as ManifoldAPIError).details
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
