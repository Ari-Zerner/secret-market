import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/db/mongodb';
import type { StoredMarket } from '@/app/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const { id, encryptedDescription, descriptionHash } = await req.json();

    if (!id || !encryptedDescription || !descriptionHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store the market data in MongoDB
    const mongoClient = await clientPromise;
    const db = mongoClient.db('secret-market');

    const storedMarket: StoredMarket = {
      id,
      encryptedDescription,
      descriptionHash,
      createdAt: new Date()
    };

    await db.collection('markets').insertOne(storedMarket);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error storing market:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
