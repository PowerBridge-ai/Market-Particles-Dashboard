'use client';

import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
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

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    performance: true,
    visualization: false,
    colors: false,
    display: false,
    graph: false,
    forces: false,
    filters: false
  });

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
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

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

  if (!minimal) {
    return (
      <div className="fixed top-0 right-0 p-4 bg-black/50 backdrop-blur-sm text-white font-mono text-xs max-w-md">
        {/* Non-minimal UI content */}
      </div>
    );
  }

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
                        type: e.target.value as 'price' | 'volume' | 'volatility' | 'combined'
                      }
                    }
                  })}
                  className="w-full bg-black/30 text-white text-sm rounded px-2 py-1 backdrop-blur-sm"
                >
                  <option value="price">Price Movement</option>
                  <option value="volume">Volume Profile</option>
                  <option value="volatility">Volatility Pattern</option>
                  <option value="combined">Combined Metrics</option>
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
                  value={config.visualization.nodeColor.byChange ? 'change' : 'neutral'}
                  onChange={(e) => onConfigChange({
                    ...config,
                    visualization: {
                      ...config.visualization,
                      nodeColor: {
                        ...config.visualization.nodeColor,
                        byChange: e.target.value === 'change'
                      }
                    }
                  })}
                  className="w-full bg-black/30 text-white text-sm rounded px-2 py-1 backdrop-blur-sm"
                >
                  <option value="neutral">Neutral</option>
                  <option value="change">By Change</option>
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
}; 