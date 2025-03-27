import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { generateMockData, generateMockLiquidationEvent } from '../utils/dataUtils';
import DataSourceSelector from './DataSourceSelector';
import { GamdaConfig, defaultConfig } from '../config/gamda.config';

// Dynamically import visualization components to avoid SSR issues
const MarketParticles = dynamic(() => import('./MarketParticles'), { ssr: false });
const MarketParticlesV2 = dynamic(() => import('./MarketParticlesV2').then(mod => ({ default: mod.MarketParticlesV2 })), { ssr: false });
const MarketParticlesV3 = dynamic(() => import('./MarketParticlesV3').then(mod => ({ default: mod.MarketParticlesV3 })), { ssr: false });
const GamdaDebugOverlay = dynamic(() => import('./GamdaDebugOverlay').then(mod => ({ default: mod.GamdaDebugOverlay })), { ssr: false });

type VisualizationType = 'basic' | 'galaxy' | 'force-graph';

const Dashboard: React.FC = () => {
  const [visualizationType, setVisualizationType] = useState<VisualizationType>('force-graph');
  const [marketData, setMarketData] = useState(generateMockData());
  const [liquidationData, setLiquidationData] = useState(generateMockLiquidationEvent());
  const [config, setConfig] = useState<GamdaConfig>(defaultConfig);
  const [showSettings, setShowSettings] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
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
  useEffect(() => {
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
  useEffect(() => {
    const interval = setInterval(() => {
      setLiquidationData(generateMockLiquidationEvent());
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle data source change
  const handleDataSourceChange = (data: any) => {
    setMarketData(data);
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
                
                {/* Display custom config controls for the current visualization */}
                {visualizationType !== 'basic' && (
                  <div className="mt-4">
                    <GamdaDebugOverlay 
                      debugInfo={debugInfo}
                      config={config}
                      onConfigChange={setConfig}
                      minimal
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Data Summary */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">Market Data</h3>
            <p className="text-gray-300">Tokens: <span className="font-mono">{marketData.tokens.length}</span></p>
            <p className="text-gray-300">Total Volume: <span className="font-mono">{marketData.tokens.reduce((sum, token) => sum + token.volume, 0).toLocaleString()}</span></p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">Latest Liquidation</h3>
            <p className="text-gray-300">Symbol: <span className="font-mono">{liquidationData.symbol}</span></p>
            <p className="text-gray-300">Side: <span className={`font-mono ${liquidationData.side === 'long' ? 'text-red-400' : 'text-green-400'}`}>{liquidationData.side}</span></p>
            <p className="text-gray-300">Amount: <span className="font-mono">${liquidationData.quantity.toLocaleString()}</span></p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">Visualization</h3>
            <p className="text-gray-300">Mode: <span className="font-mono capitalize">{visualizationType}</span></p>
            <p className="text-gray-300">FPS: <span className="font-mono">{debugInfo.fps.toFixed(1)}</span></p>
          </div>
        </div>
        
        {/* Visualization */}
        <div className="relative" style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
          {visualizationType === 'basic' && (
            <MarketParticles 
              marketData={{ 
                price: marketData.tokens[0]?.price || 50000,
                volume: marketData.tokens[0]?.volume || 1000000,
                change: marketData.tokens[0]?.price_change_24h || 0
              }} 
            />
          )}
          
          {visualizationType === 'galaxy' && (
            <MarketParticlesV2 
              marketData={marketData}
              liquidationData={liquidationData}
              autoFetch={false}
            />
          )}
          
          {visualizationType === 'force-graph' && (
            <MarketParticlesV3 
              marketData={marketData}
              liquidationData={liquidationData}
              autoFetch={false}
              config={config}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 