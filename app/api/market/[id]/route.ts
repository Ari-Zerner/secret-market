import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/db/mongodb';

export async function GET(
  request: NextRequest
) {
  const { id } = request.nextUrl.pathname.match(/\/market\/(?<id>[^\/]+)/)?.groups ?? {};
  try {
    const mongoClient = await clientPromise;
    const db = mongoClient.db('secret-market');

    const market = await db.collection('markets').findOne({ id });

    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }

    // Return encrypted data - decryption happens client-side
    return NextResponse.json({
      id: market.id,
      encryptedDescription: market.encryptedDescription,
      descriptionHash: market.descriptionHash,
      encryptedPassword: market.encryptedPassword
    });

  } catch (error) {
    console.error('Error fetching market:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
