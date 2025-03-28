import * as React from 'react';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { GamdaConfig, defaultConfig } from '../config/gamda.config';

// Use dynamic import with no SSR for the 3D component
const DynamicMarketParticles = dynamic(
  () => import('../components/MarketParticlesV3').then(mod => mod.MarketParticlesV3),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-white text-xl">Loading visualization...</div>
      </div>
    )
  }
);

// Default configuration
const loginConfig: GamdaConfig = {
  visualization: {
    mode: 'volume',
    correlation: {
      type: 'price',
      threshold: 0.5
    },
    timeframe: '24h',
    colorScheme: 'gradient',
    filters: {
      minVolume: 1000000,
      minPrice: 0.01,
      excludeStablecoins: true,
      onlyMajors: true,
    },
    grouping: {
      enabled: false,
      method: 'none',
    },
  },
  display: {
    maxNodes: 15,
    nodeSizeScale: 0.5,
    linkThicknessScale: 0.3,
    textSize: 8,
    textColor: '#ffffff',
    backgroundColor: '#000005'
  },
  graph: {
    nodeSize: 3,
    linkWidth: 0.5,
    linkOpacity: 0.2,
    linkDistance: 50,
    linkBaseColor: '#ffffff'
  },
  forces: {
    repelForce: -100,
    centerForce: 0.5,
    linkForce: 0.5,
  },
  galaxy: {
    numArms: 2,
    spiralTightness: 0.8,
    galaxyRadius: 500,
    coreRadius: 50,
    verticalDispersion: 0.1,
    rotationSpeed: 0.0005,
  },
  stars: {
    minSize: 0.5,
    maxSize: 2,
    coreStarBrightness: 0.8,
    colorIntensity: 0.6,
    multiplier: 500,
  },
  camera: {
    height: 150,
    fov: 60,
    near: 0.1,
    far: 5000,
    position: {
      x: 0,
      y: 0,
      z: 150
    },
    zoom: 1
  },
  performance: {
    updateInterval: 5000,
    maxParticles: 500,
    useTestData: false
  },
  animation: {
    enabled: true,
    rotationSpeed: 0.0005,
    frameInterval: 16
  },
};

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
            <DynamicMarketParticles 
              marketData={marketData} 
              autoFetch={true} 
              config={loginConfig}
            />
          </div>
        )}
      </main>
    </>
  );
} 