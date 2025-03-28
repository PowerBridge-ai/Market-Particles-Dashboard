import { NextApiRequest, NextApiResponse } from 'next';

// Mock data for cryptocurrency markets
const generateMockMarketData = () => {
  const symbols = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT', 
    'XRPUSDT', 'DOTUSDT', 'LTCUSDT', 'LINKUSDT', 'MATICUSDT',
    'SOLUSDT', 'AVAXUSDT', 'ATOMUSDT', 'UNIUSDT', 'FTMUSDT'
  ];

  const mockData = symbols.map(symbol => {
    const basePrice = {
      'BTC': 35000 + Math.random() * 5000,
      'ETH': 2000 + Math.random() * 400,
      'BNB': 350 + Math.random() * 50,
      'ADA': 0.5 + Math.random() * 0.2,
      'DOGE': 0.08 + Math.random() * 0.02,
      'XRP': 0.5 + Math.random() * 0.1,
      'DOT': 10 + Math.random() * 2,
      'LTC': 80 + Math.random() * 15,
      'LINK': 15 + Math.random() * 3,
      'MATIC': 1 + Math.random() * 0.2,
      'SOL': 100 + Math.random() * 20,
      'AVAX': 35 + Math.random() * 5,
      'ATOM': 12 + Math.random() * 2,
      'UNI': 8 + Math.random() * 1.5,
      'FTM': 0.3 + Math.random() * 0.1,
    }[symbol.replace('USDT', '')] || 100 + Math.random() * 20;

    const priceChange24h = (Math.random() * 10) - 5; // -5% to +5%
    const priceChange1h = (Math.random() * 2) - 1; // -1% to +1%
    const volume24h = Math.random() * 1000000000; // Random volume up to 1B

    return {
      symbol,
      lastPrice: basePrice,
      priceChange24h: priceChange24h,
      priceChange1h: priceChange1h,
      priceChangePercent24h: priceChange24h,
      priceChangePercent1h: priceChange1h,
      volume24h: volume24h,
      quoteVolume24h: volume24h * basePrice,
      count: Math.floor(Math.random() * 100000),
      high24h: basePrice * (1 + Math.random() * 0.1),
      low24h: basePrice * (1 - Math.random() * 0.1),
      openPrice: basePrice * (1 + ((Math.random() * 0.1) - 0.05)),
      closeTime: Date.now(),
      marketCap: basePrice * (Math.random() * 10000000 + 1000000),
      category: ['DeFi', 'Layer1', 'Exchange', 'Gaming', 'Meme'][Math.floor(Math.random() * 5)],
      correlations: symbols.map(s => ({
        symbol: s,
        value: Math.random() * 2 - 1 // -1 to 1
      }))
    };
  });

  return {
    markets: mockData,
    lastUpdateTime: new Date().toISOString(),
    marketStats: {
      totalMarkets: mockData.length,
      totalVolume24h: mockData.reduce((total, market) => total + market.volume24h, 0),
      averageChange24h: mockData.reduce((total, market) => total + market.priceChangePercent24h, 0) / mockData.length,
      topGainers: mockData.sort((a, b) => b.priceChangePercent24h - a.priceChangePercent24h).slice(0, 3),
      topLosers: mockData.sort((a, b) => a.priceChangePercent24h - b.priceChangePercent24h).slice(0, 3)
    }
  };
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const marketData = generateMockMarketData();
    res.status(200).json(marketData);
  } catch (error) {
    console.error('Error generating market data:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
} 