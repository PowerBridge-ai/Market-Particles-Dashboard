import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Generate some test data
    const symbols = ['BTC', 'ETH', 'SOL', 'AVAX', 'MATIC', 'DOT', 'ADA', 'LINK', 'UNI', 'AAVE'];
    const tickers = symbols.map(symbol => ({
      symbol,
      last_price: (Math.random() * 100000).toString(),
      volume_24h: (Math.random() * 1000000000).toString(),
      price_change_24h: ((Math.random() - 0.5) * 20).toString(),
      mark_price: (Math.random() * 100000).toString(),
      funding_rate: ((Math.random() - 0.5) * 0.002).toString()
    }));

    return NextResponse.json(tickers);
  } catch (error) {
    console.error('Error in tickers API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 