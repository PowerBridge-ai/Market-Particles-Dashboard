import * as React from 'react';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Use dynamic import with no SSR for the 3D component
const MarketParticlesV3 = dynamic(
  () => import('../components/MarketParticlesV3').then(mod => mod.MarketParticlesV3),
  { ssr: false }
);

export default function Home() {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/market-data');
        if (!response.ok) {
          throw new Error(`Error fetching market data: ${response.statusText}`);
        }
        const data = await response.json();
        setMarketData(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch market data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  return (
    <>
      <Head>
        <title>Market Particles Dashboard</title>
        <meta name="description" content="Interactive market data visualization" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="fixed inset-0 flex flex-col bg-black text-white">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-xl">Loading market data visualization...</div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-xl text-red-500">Error: {error}</div>
          </div>
        ) : (
          <div className="flex-1 w-full h-full">
            <MarketParticlesV3 marketData={marketData} autoFetch={true} />
          </div>
        )}
      </main>
    </>
  );
} 