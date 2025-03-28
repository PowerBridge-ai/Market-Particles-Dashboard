'use client';

import React, { useEffect, useState, useRef } from 'react';
import { GamdaConfig } from '../config/gamda.config';
import { Settings, Database, Activity } from 'react-feather';

interface TableStatus {
  rowCount: number;
  lastUpdate: string;
}

interface DbStatus {
  isConnected: boolean;
  tables: {
    tickers: TableStatus;
    liquidations: TableStatus;
    market_movers: TableStatus;
    kline_data: TableStatus;
  };
}

interface DebugInfo {
  dbStatus: DbStatus | null;
  fps: number;
  activeTokens: number;
  latestLiquidation?: {
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    timestamp: string;
  };
}

interface GamdaDebugOverlayProps {
  debugInfo: DebugInfo;
  config: GamdaConfig;
  onConfigChange: (newConfig: GamdaConfig) => void;
  minimal?: boolean;
}

interface LogMessage {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'warning';
}

export const GamdaDebugOverlay: React.FC<GamdaDebugOverlayProps> = ({
  debugInfo,
  config,
  onConfigChange,
  minimal = false
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showDbStatus, setShowDbStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'visualization' | 'filters'>('general');
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: 'info' | 'error' | 'warning' = 'info') => {
    setLogs(prev => [...prev.slice(-100), {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  // Log important state changes
  useEffect(() => {
    if (debugInfo.dbStatus?.isConnected) {
      addLog('Database connected', 'info');
    } else {
      addLog('Database disconnected', 'error');
    }
  }, [debugInfo.dbStatus?.isConnected]);

  useEffect(() => {
    if (debugInfo.activeTokens === 0) {
      addLog('No active tokens', 'warning');
    } else {
      addLog(`Active tokens: ${debugInfo.activeTokens}`, 'info');
    }
  }, [debugInfo.activeTokens]);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  if (minimal) {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
      performance: true,
      visualization: false,
      colors: false,
      display: false,
      graph: false,
      forces: false,
      filters: false
    });

    const toggleSection = (section: string) => {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    };

    const SectionHeader = ({ title, section }: { title: string; section: string }) => (
      <button
        onClick={() => toggleSection(section)}
        className="flex items-center justify-between w-full text-sm font-medium mb-2 hover:text-blue-400 transition-colors"
      >
        <span>{title}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 transition-transform ${expandedSections[section] ? 'transform rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );

    return (
      <div className="space-y-4 w-72">
        <div className="space-y-4">
          {/* Performance Settings */}
          <div className="space-y-2 bg-black/20 backdrop-blur-sm rounded-lg p-3">
            <SectionHeader title="Performance" section="performance" />
            {expandedSections.performance && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs">Data Source</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onConfigChange({
                        ...config,
                        performance: { ...config.performance, useTestData: false }
                      })}
                      className={`px-2 py-1 text-xs rounded ${!config.performance.useTestData ? 'bg-blue-500 text-white' : 'bg-black/30 text-gray-400'}`}
                    >
                      Live
                    </button>
                    <button
                      onClick={() => onConfigChange({
                        ...config,
                        performance: { ...config.performance, useTestData: true }
                      })}
                      className={`px-2 py-1 text-xs rounded ${config.performance.useTestData ? 'bg-blue-500 text-white' : 'bg-black/30 text-gray-400'}`}
                    >
                      Demo
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1">Data Refresh (ms)</label>
                  <input
                    type="range"
                    min="1000"
                    max="10000"
                    step="500"
                    value={config.performance.updateInterval}
                    onChange={(e) => onConfigChange({
                      ...config,
                      performance: { ...config.performance, updateInterval: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">{config.performance.updateInterval}ms</div>
                </div>
                <div>
                  <label className="block text-xs mb-1">Animation Refresh (ms)</label>
                  <input
                    type="range"
                    min="16"
                    max="100"
                    step="16"
                    value={config.animation.frameInterval}
                    onChange={(e) => onConfigChange({
                      ...config,
                      animation: { ...config.animation, frameInterval: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">{config.animation.frameInterval}ms (~{Math.round(1000/config.animation.frameInterval)}fps)</div>
                </div>
                <div>
                  <label className="block text-xs mb-1">Max Nodes</label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={config.display.maxNodes}
                    onChange={(e) => onConfigChange({
                      ...config,
                      display: { ...config.display, maxNodes: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">{config.display.maxNodes} nodes</div>
                </div>
              </div>
            )}
          </div>

          {/* Visualization Settings */}
          <div className="space-y-2 bg-black/20 backdrop-blur-sm rounded-lg p-3">
            <SectionHeader title="Visualization" section="visualization" />
            {expandedSections.visualization && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs mb-1">Mode</label>
                  <select
                    value={config.visualization.mode}
                    onChange={(e) => onConfigChange({
                      ...config,
                      visualization: { ...config.visualization, mode: e.target.value as any }
                    })}
                    className="w-full bg-black/30 text-white text-sm rounded px-2 py-1 backdrop-blur-sm"
                  >
                    <option value="volume">Volume</option>
                    <option value="volatility">Volatility</option>
                    <option value="momentum">Momentum</option>
                    <option value="liquidations">Liquidations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1">Correlation Type</label>
                  <select
                    value={config.visualization.correlation.type}
                    onChange={(e) => onConfigChange({
                      ...config,
                      visualization: { 
                        ...config.visualization, 
                        correlation: {
                          ...config.visualization.correlation,
                          type: e.target.value as any
                        }
                      }
                    })}
                    className="w-full px-2 py-1 bg-gray-700 rounded text-sm"
                  >
                    <option value="price">Price Change</option>
                    <option value="volume">Volume</option>
                    <option value="volatility">Volatility</option>
                    <option value="combined">Combined</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Color Settings */}
          <div className="space-y-2 bg-black/20 backdrop-blur-sm rounded-lg p-3">
            <SectionHeader title="Colors" section="colors" />
            {expandedSections.colors && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs mb-1">Node Color Scheme</label>
                  <select
                    value={config.visualization.colorScheme}
                    onChange={(e) => onConfigChange({
                      ...config,
                      visualization: { ...config.visualization, colorScheme: e.target.value as any }
                    })}
                    className="w-full bg-black/30 text-white text-sm rounded px-2 py-1 backdrop-blur-sm"
                  >
                    <option value="default">Default</option>
                    <option value="heat">Heat Map</option>
                    <option value="gradient">Gradient</option>
                    <option value="rainbow">Rainbow</option>
                    <option value="category">Category</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1">Text Color</label>
                  <input
                    type="color"
                    value={config.display.textColor}
                    onChange={(e) => onConfigChange({
                      ...config,
                      display: { ...config.display, textColor: e.target.value }
                    })}
                    className="w-full h-8 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Link Color</label>
                  <input
                    type="color"
                    value={config.graph.linkBaseColor}
                    onChange={(e) => onConfigChange({
                      ...config,
                      graph: { ...config.graph, linkBaseColor: e.target.value }
                    })}
                    className="w-full h-8 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Background Color</label>
                  <input
                    type="color"
                    value={config.display.backgroundColor}
                    onChange={(e) => onConfigChange({
                      ...config,
                      display: { ...config.display, backgroundColor: e.target.value }
                    })}
                    className="w-full h-8 rounded"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Display Settings */}
          <div className="space-y-2 bg-black/20 backdrop-blur-sm rounded-lg p-3">
            <SectionHeader title="Display" section="display" />
            {expandedSections.display && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs mb-1">Node Size Scale</label>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={config.display.nodeSizeScale}
                    onChange={(e) => onConfigChange({
                      ...config,
                      display: { ...config.display, nodeSizeScale: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Link Thickness</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={config.display.linkThicknessScale}
                    onChange={(e) => onConfigChange({
                      ...config,
                      display: { ...config.display, linkThicknessScale: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Text Size</label>
                  <input
                    type="range"
                    min="4"
                    max="16"
                    step="1"
                    value={config.display.textSize}
                    onChange={(e) => onConfigChange({
                      ...config,
                      display: { ...config.display, textSize: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Graph Settings */}
          <div className="space-y-2 bg-black/20 backdrop-blur-sm rounded-lg p-3">
            <SectionHeader title="Graph" section="graph" />
            {expandedSections.graph && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs mb-1">Link Distance</label>
                  <input
                    type="range"
                    min="30"
                    max="200"
                    step="10"
                    value={config.graph.linkDistance}
                    onChange={(e) => onConfigChange({
                      ...config,
                      graph: { ...config.graph, linkDistance: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Link Opacity</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={config.graph.linkOpacity}
                    onChange={(e) => onConfigChange({
                      ...config,
                      graph: { ...config.graph, linkOpacity: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Force Settings */}
          <div className="space-y-2 bg-black/20 backdrop-blur-sm rounded-lg p-3">
            <SectionHeader title="Forces" section="forces" />
            {expandedSections.forces && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs mb-1">Repel Force</label>
                  <input
                    type="range"
                    min="-500"
                    max="-50"
                    step="50"
                    value={config.forces.repelForce}
                    onChange={(e) => onConfigChange({
                      ...config,
                      forces: { ...config.forces, repelForce: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Link Force</label>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={config.forces.linkForce}
                    onChange={(e) => onConfigChange({
                      ...config,
                      forces: { ...config.forces, linkForce: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Filter Settings */}
          <div className="space-y-2 bg-black/20 backdrop-blur-sm rounded-lg p-3">
            <SectionHeader title="Filters" section="filters" />
            {expandedSections.filters && (
              <div className="space-y-4 pt-2">
                <div className="flex flex-col gap-2 text-xs">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={config.visualization.filters.excludeStablecoins}
                      onChange={(e) => onConfigChange({
                        ...config,
                        visualization: {
                          ...config.visualization,
                          filters: {
                            ...config.visualization.filters,
                            excludeStablecoins: e.target.checked
                          }
                        }
                      })}
                      className="form-checkbox h-3 w-3"
                    />
                    <span>Exclude Stablecoins</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={config.visualization.filters.onlyMajors}
                      onChange={(e) => onConfigChange({
                        ...config,
                        visualization: {
                          ...config.visualization,
                          filters: {
                            ...config.visualization.filters,
                            onlyMajors: e.target.checked
                          }
                        }
                      })}
                      className="form-checkbox h-3 w-3"
                    />
                    <span>Only Major Tokens</span>
                  </label>
                  <div>
                    <label className="block text-xs mb-1">Min Volume (USD)</label>
                    <input
                      type="number"
                      value={config.visualization.filters.minVolume}
                      onChange={(e) => onConfigChange({
                        ...config,
                        visualization: {
                          ...config.visualization,
                          filters: {
                            ...config.visualization.filters,
                            minVolume: Number(e.target.value)
                          }
                        }
                      })}
                      className="w-full bg-black/30 text-white text-sm rounded px-2 py-1 backdrop-blur-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute bottom-0 right-0 p-4 space-y-2">
        {/* FPS Counter */}
        <div className="flex items-center space-x-2 text-white text-sm">
          <span>🎯 FPS: {debugInfo.fps.toFixed(1)}</span>
          <span>Active Tokens: {debugInfo.activeTokens}</span>
        </div>

        {/* Debug Console */}
        <div 
          ref={logContainerRef}
          className="bg-black bg-opacity-80 text-white p-2 rounded-lg w-96 h-48 overflow-y-auto font-mono text-xs pointer-events-auto"
          style={{ maxHeight: '200px' }}
        >
          {logs.map((log, i) => (
            <div 
              key={i} 
              className={`${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'warning' ? 'text-yellow-400' :
                'text-green-400'
              }`}
            >
              [{log.timestamp}] {log.message}
            </div>
          ))}
        </div>

        {/* Database Status */}
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDbStatus(!showDbStatus)}
            className="bg-gray-800 text-white px-4 py-2 rounded pointer-events-auto hover:bg-gray-700"
          >
            Database Status
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-gray-800 text-white px-4 py-2 rounded pointer-events-auto hover:bg-gray-700"
          >
            Settings
          </button>
        </div>

        {showDbStatus && debugInfo.dbStatus && (
          <div className="bg-black bg-opacity-80 text-white p-4 rounded-lg pointer-events-auto">
            <h3 className="text-lg mb-2">Database Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={debugInfo.dbStatus.isConnected ? 'text-green-400' : 'text-red-400'}>
                  {debugInfo.dbStatus.isConnected ? '● Connected' : '● Disconnected'}
                </span>
              </div>
              {Object.entries(debugInfo.dbStatus.tables).map(([table, status]) => (
                <div key={table} className="flex justify-between">
                  <span className="capitalize">{table}:</span>
                  <div className="text-right">
                    <div>Rows: {status.rowCount}</div>
                    <div className="text-xs text-gray-400">
                      Last Update: {formatTime(status.lastUpdate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showSettings && (
          <div className="bg-black bg-opacity-80 text-white p-4 rounded-lg pointer-events-auto w-96">
            <h3 className="text-lg mb-4">Settings</h3>
            
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-3 py-1 rounded ${activeTab === 'general' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('visualization')}
                className={`px-3 py-1 rounded ${activeTab === 'visualization' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                Visualization
              </button>
              <button
                onClick={() => setActiveTab('filters')}
                className={`px-3 py-1 rounded ${activeTab === 'filters' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                Filters
              </button>
            </div>

            {activeTab === 'general' && (
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">Node Size</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={config.display.nodeSizeScale}
                    onChange={(e) => onConfigChange({
                      ...config,
                      display: { ...config.display, nodeSizeScale: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block mb-2">Link Thickness</label>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={config.display.linkThicknessScale}
                    onChange={(e) => onConfigChange({
                      ...config,
                      display: { ...config.display, linkThicknessScale: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block mb-2">Link Distance</label>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    step="10"
                    value={config.graph.linkDistance}
                    onChange={(e) => onConfigChange({
                      ...config,
                      graph: { ...config.graph, linkDistance: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block mb-2">Repel Force</label>
                  <input
                    type="range"
                    min="-200"
                    max="-10"
                    step="10"
                    value={config.forces.repelForce}
                    onChange={(e) => onConfigChange({
                      ...config,
                      forces: { ...config.forces, repelForce: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {activeTab === 'visualization' && (
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">Visualization Mode</label>
                  <select
                    value={config.visualization.mode}
                    onChange={(e) => onConfigChange({
                      ...config,
                      visualization: { ...config.visualization, mode: e.target.value as any }
                    })}
                    className="w-full bg-gray-700 rounded px-2 py-1"
                  >
                    <option value="volume">Volume Leaders</option>
                    <option value="volatility">Volatility Leaders</option>
                    <option value="momentum">Momentum Leaders</option>
                    <option value="liquidations">Liquidation Map</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2">Correlation Type</label>
                  <select
                    value={config.visualization.correlation.type}
                    onChange={(e) => onConfigChange({
                      ...config,
                      visualization: { 
                        ...config.visualization, 
                        correlation: {
                          ...config.visualization.correlation,
                          type: e.target.value as any
                        }
                      }
                    })}
                    className="w-full px-2 py-1 bg-gray-700 rounded text-sm"
                  >
                    <option value="price">Price Change</option>
                    <option value="volume">Volume</option>
                    <option value="volatility">Volatility</option>
                    <option value="combined">Combined</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2">Timeframe</label>
                  <select
                    value={config.visualization.timeframe}
                    onChange={(e) => onConfigChange({
                      ...config,
                      visualization: { ...config.visualization, timeframe: e.target.value as any }
                    })}
                    className="w-full bg-gray-700 rounded px-2 py-1"
                  >
                    <option value="1h">1 Hour</option>
                    <option value="4h">4 Hours</option>
                    <option value="24h">24 Hours</option>
                    <option value="7d">7 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2">Color Scheme</label>
                  <select
                    value={config.visualization.colorScheme}
                    onChange={(e) => onConfigChange({
                      ...config,
                      visualization: { ...config.visualization, colorScheme: e.target.value as any }
                    })}
                    className="w-full bg-gray-700 rounded px-2 py-1"
                  >
                    <option value="default">Default</option>
                    <option value="heat">Heat Map</option>
                    <option value="gradient">Gradient</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'filters' && (
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">Minimum Volume (USD)</label>
                  <input
                    type="number"
                    value={config.visualization.filters.minVolume}
                    onChange={(e) => onConfigChange({
                      ...config,
                      visualization: {
                        ...config.visualization,
                        filters: {
                          ...config.visualization.filters,
                          minVolume: Number(e.target.value)
                        }
                      }
                    })}
                    className="w-full bg-gray-700 rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.visualization.filters.excludeStablecoins}
                      onChange={(e) => onConfigChange({
                        ...config,
                        visualization: {
                          ...config.visualization,
                          filters: {
                            ...config.visualization.filters,
                            excludeStablecoins: e.target.checked
                          }
                        }
                      })}
                      className="form-checkbox"
                    />
                    <span>Exclude Stablecoins</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.visualization.filters.onlyMajors}
                      onChange={(e) => onConfigChange({
                        ...config,
                        visualization: {
                          ...config.visualization,
                          filters: {
                            ...config.visualization.filters,
                            onlyMajors: e.target.checked
                          }
                        }
                      })}
                      className="form-checkbox"
                    />
                    <span>Only Major Tokens</span>
                  </label>
                </div>
                <div>
                  <label className="block mb-2">Grouping Method</label>
                  <select
                    value={config.visualization.grouping.method}
                    onChange={(e) => onConfigChange({
                      ...config,
                      visualization: {
                        ...config.visualization,
                        grouping: {
                          ...config.visualization.grouping,
                          method: e.target.value as any
                        }
                      }
                    })}
                    className="w-full bg-gray-700 rounded px-2 py-1"
                  >
                    <option value="market-cap">Market Cap</option>
                    <option value="sector">Sector</option>
                    <option value="exchange">Exchange</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 