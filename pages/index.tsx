'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';

interface MarketToken {
  symbol: string;
  price: number;
  volume: number;
  price_change_24h: number;
}

interface MarketData {
  tokens: MarketToken[];
}

export default function Home() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Generate test data for now
        const testData: MarketData = {
          tokens: [
            { symbol: 'BTC', price: 48000, volume: 1000000000, price_change_24h: 2.5 },
            { symbol: 'ETH', price: 3000, volume: 500000000, price_change_24h: 1.8 },
            { symbol: 'SOL', price: 100, volume: 200000000, price_change_24h: 5.2 },
            { symbol: 'DOGE', price: 0.1, volume: 100000000, price_change_24h: -1.3 },
            { symbol: 'ADA', price: 0.5, volume: 80000000, price_change_24h: 0.7 },
          ]
        };
        
        setMarketData(testData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load market data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading market data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-2xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Market Particles Dashboard</h1>
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700">
                <th className="py-3 px-4 text-left">Symbol</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-right">24h Change</th>
                <th className="py-3 px-4 text-right">Volume</th>
              </tr>
            </thead>
            <tbody>
              {marketData?.tokens.map((token) => (
                <tr key={token.symbol} className="border-t border-gray-700">
                  <td className="py-3 px-4 font-medium">{token.symbol}</td>
                  <td className="py-3 px-4 text-right">${token.price.toLocaleString()}</td>
                  <td className={`py-3 px-4 text-right ${token.price_change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {token.price_change_24h >= 0 ? '+' : ''}{token.price_change_24h.toFixed(2)}%
                  </td>
                  <td className="py-3 px-4 text-right">${(token.volume / 1000000).toFixed(2)}M</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-8 text-center text-gray-400">
          <p>This is a simplified version of the Market Particles Dashboard.</p>
          <p>Note: Currently displaying test data.</p>
        </div>
      </div>
    </div>
  );
} 