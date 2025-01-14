import { NextRequest, NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';
import clientPromise from '@/app/lib/db/mongodb';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const apiKey = req.headers.get('x-api-key');

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
      try {
        const bytes = CryptoJS.AES.decrypt(market.encryptedDescription, apiKey);
        const description = bytes.toString(CryptoJS.enc.Utf8);
        
        if (!description) {
          return NextResponse.json(
            { error: 'Invalid API key' },
            { status: 401 }
          );
        }

        return NextResponse.json({ description });
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }
    }

    // Otherwise just return public info
    return NextResponse.json({
      id: market.id,
      descriptionHash: market.descriptionHash,
      revealed: market.revealed
    });

  } catch (error) {
    console.error('Error revealing market:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { apiKey } = await req.json();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401 }
      );
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db('secret-market');
    
    const market = await db.collection('markets').findOne({ id: await params.id });
    
    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }

    // Rest of the function stays the same...
  } catch (error) {
    console.error('Error revealing market:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
