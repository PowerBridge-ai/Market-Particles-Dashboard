import * as React from 'react';
import dynamic from 'next/dynamic';
import { generateMockData, generateMockLiquidationEvent } from '../utils/dataUtils';
import type { MarketData as RawMarketData } from '../utils/dataUtils';
import type { ProcessedMarketData } from '../types/market';
import type { LiquidationData } from './MarketParticlesV2';
import DataSourceSelector from './DataSourceSelector';
import { GamdaConfig, defaultConfig } from '../config/gamda.config';
import { processMarketData } from '../types/market';

// Dynamically import visualization components to avoid SSR issues
const MarketParticles = dynamic(() => import('./MarketParticles'), { ssr: false });
const MarketParticlesV2 = dynamic(() => import('./MarketParticlesV2'), { ssr: false });
const MarketParticlesV3 = dynamic(() => import('./MarketParticlesV3').then(mod => ({ default: mod.MarketParticlesV3 })), { ssr: false });
const GamdaDebugOverlay = dynamic(() => import('./GamdaDebugOverlay').then(mod => ({ default: mod.GamdaDebugOverlay })), { ssr: false });

type VisualizationType = 'basic' | 'galaxy' | 'force-graph';

const Dashboard: React.FC = () => {
  const [visualizationType, setVisualizationType] = React.useState('galaxy' as VisualizationType);
  const [rawMarketData, setRawMarketData] = React.useState<RawMarketData>(generateMockData());
  const [liquidationData, setLiquidationData] = React.useState(generateMockLiquidationEvent());
  const [config, setConfig] = React.useState(defaultConfig);
  const [showSettings, setShowSettings] = React.useState(true);

  // Process market data
  const marketData = processMarketData(rawMarketData);

  const [debugInfo, setDebugInfo] = React.useState({
    dbStatus: {
      isConnected: true,
      tables: {
        tickers: { rowCount: marketData.tokens.length, lastUpdate: new Date().toISOString() },
        liquidations: { rowCount: marketData.liquidations.length, lastUpdate: new Date().toISOString() },
        market_movers: { rowCount: 0, lastUpdate: '' },
        kline_data: { rowCount: 0, lastUpdate: '' }
      }
    },
    fps: 60,
    activeTokens: marketData.tokens.length,
    latestLiquidation: liquidationData
  });
  
  // Update debug info when market data changes
  React.useEffect(() => {
    setDebugInfo(prev => ({
      ...prev,
      dbStatus: {
        ...prev.dbStatus,
        tables: {
          ...prev.dbStatus.tables,
          tickers: { 
            rowCount: marketData.tokens.length, 
            lastUpdate: new Date().toISOString() 
          },
          liquidations: { 
            rowCount: marketData.liquidations.length, 
            lastUpdate: new Date().toISOString() 
          }
        }
      },
      activeTokens: marketData.tokens.length,
      latestLiquidation: liquidationData
    }));
  }, [marketData, liquidationData]);
  
  // Simulate liquidation events
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLiquidationData(generateMockLiquidationEvent());
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle data source change
  const handleDataSourceChange = (data: RawMarketData) => {
    setRawMarketData(data);
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Market Particles Dashboard</h1>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              {showSettings ? 'Hide Settings' : 'Show Settings'}
            </button>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto p-4">
        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <DataSourceSelector onDataSourceChange={handleDataSourceChange} />
            </div>
            
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-xl font-bold mb-4">Visualization Settings</h2>
                
                <div className="mb-4">
                  <label className="block mb-2">Visualization Type</label>
                  <div className="flex space-x-2">
                    <button
                      className={`px-4 py-2 rounded ${visualizationType === 'basic' ? 'bg-blue-600' : 'bg-gray-700'}`}
                      onClick={() => setVisualizationType('basic')}
                    >
                      Basic Particles
                    </button>
                    <button
                      className={`px-4 py-2 rounded ${visualizationType === 'galaxy' ? 'bg-blue-600' : 'bg-gray-700'}`}
                      onClick={() => setVisualizationType('galaxy')}
                    >
                      Galaxy
                    </button>
                    <button
                      className={`px-4 py-2 rounded ${visualizationType === 'force-graph' ? 'bg-blue-600' : 'bg-gray-700'}`}
                      onClick={() => setVisualizationType('force-graph')}
                    >
                      Force Graph
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;