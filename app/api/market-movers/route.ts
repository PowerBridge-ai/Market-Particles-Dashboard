import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Generate some test market movers data
    const movers = [
      { symbol: 'BTC', change_24h: 5.2, volume_change: 15.3 },
      { symbol: 'ETH', change_24h: 3.8, volume_change: 10.2 },
      { symbol: 'SOL', change_24h: 8.1, volume_change: 25.7 },
      { symbol: 'AVAX', change_24h: -4.2, volume_change: 18.9 },
      { symbol: 'MATIC', change_24h: 6.5, volume_change: 12.4 }
    ];

    return NextResponse.json(movers);
  } catch (error) {
    console.error('Error in market-movers API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 