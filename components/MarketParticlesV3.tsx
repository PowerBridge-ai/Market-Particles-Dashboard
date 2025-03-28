'use client';

import { useEffect, useRef, useState } from 'react';
import { GamdaDebugOverlay } from './GamdaDebugOverlay';
import { GamdaConfig, defaultConfig } from '../config/gamda.config';
// @ts-ignore
import ForceGraph3D from '3d-force-graph';
// @ts-ignore
import SpriteText from 'three-spritetext';
import * as d3 from 'd3';

interface SavedConfig {
  id: string;
  name: string;
  config: GamdaConfig;
  createdAt: string;
  updatedAt: string;
}

interface Node {
  id: string;
  group: number;
  val: number;  // Size of node
  color?: string;
  x?: number;
  y?: number;
  z?: number;
}

interface Link {
  source: string;
  target: string;
  value: number;  // Link strength
  color?: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface MarketData {
  tokens: Array<{
    symbol: string;
    price: number;
    volume: number;
    price_change_24h: number;
    mark_price: number;
    funding_rate: number;
  }>;
  liquidations: Array<{
    type: 'long' | 'short';
    amount: number;
    symbol: string;
  }>;
}

export interface MarketParticlesProps {
  marketData?: MarketData | null;
  liquidationData?: LiquidationData;
  autoFetch?: boolean;
  config?: GamdaConfig;
}

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

interface LiquidationData {
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  timestamp: string;
}

interface NodeObject extends Node {
  x: number;
  y: number;
  z: number;
}

interface LinkObject {
  source: NodeObject;
  target: NodeObject;
  value: number;
  color?: string;
}

interface ForceGraphInstance {
  width: (width: number) => ForceGraphInstance;
  height: (height: number) => ForceGraphInstance;
  backgroundColor: (color: string) => ForceGraphInstance;
  nodeThreeObject: (fn: (node: NodeObject) => any) => ForceGraphInstance;
  nodeThreeObjectExtend: (bool: boolean) => ForceGraphInstance;
  nodeColor: (fn: (node: NodeObject) => string) => ForceGraphInstance;
  nodeVal: (fn: (node: NodeObject) => number) => ForceGraphInstance;
  linkColor: (fn: (link: LinkObject) => string) => ForceGraphInstance;
  linkWidth: (fn: (link: LinkObject) => number) => ForceGraphInstance;
  linkOpacity: (opacity: number) => ForceGraphInstance;
  linkDirectionalParticles: (num: number) => ForceGraphInstance;
  linkDirectionalParticleSpeed: (speed: number) => ForceGraphInstance;
  showNavInfo: (show: boolean) => ForceGraphInstance;
  d3Force: (forceName: string, force: any) => ForceGraphInstance;
  cameraPosition: (pos: { x: number; y: number; z: number }) => void;
  graphData: (data?: GraphData) => { nodes: NodeObject[]; links: LinkObject[] };
}

interface ForceGraphConstructor {
  new (): {
    (container: HTMLElement): ForceGraphInstance;
  };
}

export const MarketParticlesV3: React.FC<MarketParticlesProps> = ({
  marketData: propMarketData,
  liquidationData,
  autoFetch = false,
  config: propConfig
}) => {
  // Load saved configs first to find View 1
  const loadSavedConfigs = () => {
    try {
      const savedConfigsStr = localStorage.getItem('gamdaConfigs');
      if (savedConfigsStr) {
        const configs = JSON.parse(savedConfigsStr);
        const view1Config = configs.find((c: SavedConfig) => c.name === 'View 1');
        return {
          configs,
          defaultConfig: view1Config?.config || propConfig || defaultConfig
        };
      }
    } catch (error) {
      console.error('Error loading saved configurations:', error);
    }
    return {
      configs: [],
      defaultConfig: propConfig || defaultConfig
    };
  };

  const { configs: initialConfigs, defaultConfig: initialConfig } = loadSavedConfigs();

  const [fetchedMarketData, setFetchedMarketData] = useState<MarketData | null>(null);
  const [config, setConfig] = useState<GamdaConfig>(initialConfig);
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>(initialConfigs);
  const [configName, setConfigName] = useState<string>('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [cameraPosition, setCameraPosition] = useState({
    x: initialConfig.camera.position?.x || 0,
    y: initialConfig.camera.position?.y || 0,
    z: initialConfig.camera.position?.z || 150
  });
  const [cameraZoom, setCameraZoom] = useState(initialConfig.camera.zoom || 1);
  const [showCameraControls, setShowCameraControls] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    dbStatus: null,
    fps: 0,
    activeTokens: 0
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphInstance | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameTime = useRef(performance.now());
  const frameCount = useRef(0);
  const fpsUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  const marketData = autoFetch ? fetchedMarketData : propMarketData;

  // FPS calculation
  useEffect(() => {
    const updateFPS = () => {
      const now = performance.now();
      const elapsed = now - lastFrameTime.current;
      const fps = frameCount.current / (elapsed / 1000);
      setDebugInfo(prev => ({ ...prev, fps }));
      frameCount.current = 0;
      lastFrameTime.current = now;
    };

    fpsUpdateInterval.current = setInterval(updateFPS, 1000);
    return () => {
      if (fpsUpdateInterval.current) {
        clearInterval(fpsUpdateInterval.current);
      }
    };
  }, []);

  // Define group colors similar to Obsidian
  const GROUP_COLORS = [
    '#4CAF50',  // Green
    '#f44336',  // Red
    '#2196F3',  // Blue
    '#E91E63',  // Pink
  ];

  // Create graph data from market data
  const createGraphData = (data: MarketData): GraphData => {
    console.log('Creating graph data from market data');
    
    if (!data || !data.tokens || data.tokens.length === 0) {
      console.warn('No token data available');
      return { nodes: [], links: [] };
    }

    const nodes: Node[] = [];
    const links: Link[] = [];
    
    try {
      // Filter tokens based on configuration
      let filteredTokens = data.tokens;
      if (config.visualization.filters.minVolume > 0) {
        filteredTokens = filteredTokens.filter(t => t.volume >= config.visualization.filters.minVolume);
      }
      if (config.visualization.filters.excludeStablecoins) {
        const stablecoins = ['USDT', 'USDC', 'DAI', 'BUSD', 'UST'];
        filteredTokens = filteredTokens.filter(t => !stablecoins.includes(t.symbol));
      }
      if (config.visualization.filters.onlyMajors) {
        const majors = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX', 'MATIC'];
        filteredTokens = filteredTokens.filter(t => majors.includes(t.symbol));
      }

      // Sort and limit tokens based on visualization mode
      switch (config.visualization.mode) {
        case 'volume':
          filteredTokens.sort((a, b) => b.volume - a.volume);
          break;
        case 'volatility':
          filteredTokens.sort((a, b) => Math.abs(b.price_change_24h) - Math.abs(a.price_change_24h));
          break;
        case 'momentum':
          filteredTokens.sort((a, b) => b.price_change_24h - a.price_change_24h);
          break;
        case 'liquidations':
          // Sort by liquidation volume if available
          break;
      }

      filteredTokens = filteredTokens.slice(0, config.display.maxNodes);

      // Calculate metrics for visualization
      const getMetricValue = (token: MarketData['tokens'][0]) => {
        switch (config.visualization.mode) {
          case 'volume':
            return Math.log10(token.volume);
          case 'volatility':
            return Math.abs(token.price_change_24h);
          case 'momentum':
            return token.price_change_24h;
          case 'liquidations':
            return token.volume; // Use appropriate liquidation metric
          default:
            return Math.log10(token.volume);
        }
      };

      // Get metric values for normalization
      const metricValues = filteredTokens.map(getMetricValue);
      const maxMetric = Math.max(...metricValues);
      const minMetric = Math.min(...metricValues);
      const metricRange = maxMetric - minMetric;

      // Create nodes with appropriate colors and sizes
      filteredTokens.forEach((token, index) => {
        const metric = getMetricValue(token);
        const normalizedMetric = (metric - minMetric) / metricRange;
        
        // Determine node color based on visualization mode and color scheme
        let color = '#ffffff';
        switch (config.visualization.colorScheme) {
          case 'heat':
            color = d3.interpolateReds(normalizedMetric);
            break;
          case 'gradient':
            color = d3.interpolateViridis(normalizedMetric);
            break;
          default:
            const group = Math.min(Math.floor(normalizedMetric * GROUP_COLORS.length), GROUP_COLORS.length - 1);
            color = GROUP_COLORS[group];
        }

        nodes.push({
          id: token.symbol,
          group: Math.floor(normalizedMetric * 4),
          val: Math.max(5, normalizedMetric * config.display.nodeSizeScale * 20),
          color
        });
      });

      // Create links based on correlation type
      if (nodes.length > 1) {
        nodes.forEach((sourceNode, i) => {
          const sourceToken = filteredTokens.find(t => t.symbol === sourceNode.id);
          if (!sourceToken) return;

          nodes.slice(i + 1).forEach(targetNode => {
            const targetToken = filteredTokens.find(t => t.symbol === targetNode.id);
            if (!targetToken) return;

            let correlation = 0;
            switch (config.visualization.correlationType) {
              case 'price':
                correlation = Math.abs(
                  sourceToken.price_change_24h - targetToken.price_change_24h
                ) / Math.max(
                  Math.abs(sourceToken.price_change_24h),
                  Math.abs(targetToken.price_change_24h),
                  1
                );
                break;
              case 'volume':
                correlation = Math.abs(
                  Math.log10(sourceToken.volume) - Math.log10(targetToken.volume)
                ) / Math.log10(Math.max(sourceToken.volume, targetToken.volume));
                break;
              case 'volatility':
                // Add volatility correlation calculation
                break;
              case 'combined':
                // Add combined metrics correlation
                break;
            }

            if (correlation < config.visualization.correlationThreshold) {
              links.push({
                source: sourceNode.id,
                target: targetNode.id,
                value: config.display.linkThicknessScale * (1 - correlation),
                color: `rgba(255,255,255,${config.graph.linkOpacity})`
              });
            }
          });
        });
      }

      console.log('Generated graph data:', {
        nodeCount: nodes.length,
        linkCount: links.length,
        mode: config.visualization.mode,
        correlationType: config.visualization.correlationType
      });

    } catch (error) {
      console.error('Error creating graph data:', error);
      return { nodes: [], links: [] };
    }

    return { nodes, links };
  };

  // Generate test data if no market data is available
  const generateTestData = (): MarketData => {
    console.log('Generating test data');
    const symbols = ['BTC', 'ETH', 'SOL', 'AVAX', 'MATIC', 'DOT', 'ADA', 'LINK', 'UNI', 'AAVE', 'SNX', 'DOGE', 'XRP', 'BNB', 'ATOM'];
    const tokens = symbols.map(symbol => ({
      symbol,
      price: Math.random() * 100000,
      volume: Math.random() * 1000000000,
      price_change_24h: (Math.random() - 0.5) * 20,
      mark_price: Math.random() * 100000,
      funding_rate: (Math.random() - 0.5) * 0.002
    }));

    const testData = {
      tokens,
      liquidations: []
    };
    console.log('Generated test data:', testData);
    return testData;
  };

  // Fetch market data if autoFetch is enabled
  useEffect(() => {
    console.log('Data fetch effect triggered', { autoFetch, hasMarketData: !!propMarketData });

    if (autoFetch) {
      const fetchData = async () => {
        try {
          // If using test data, don't make API calls
          if (config.performance.useTestData) {
            const testData = generateTestData();
            setFetchedMarketData(testData);
            setDebugInfo(prev => ({
              ...prev,
              dbStatus: {
                isConnected: true,
                tables: {
                  tickers: { 
                    rowCount: testData.tokens.length, 
                    lastUpdate: new Date().toISOString() 
                  },
                  liquidations: { 
                    rowCount: 0, 
                    lastUpdate: new Date().toISOString() 
                  },
                  market_movers: { 
                    rowCount: 0, 
                    lastUpdate: new Date().toISOString() 
                  },
                  kline_data: { 
                    rowCount: 0, 
                    lastUpdate: new Date().toISOString() 
                  }
                }
              },
              activeTokens: testData.tokens.length
            }));
            return;
          }

          console.log('Fetching market data...');
          const [tickersResponse, marketMoversResponse] = await Promise.all([
            fetch('/api/tickers'),
            fetch('/api/market-movers')
          ]);

          if (!tickersResponse.ok || !marketMoversResponse.ok) {
            throw new Error('Failed to fetch market data');
          }

          const tickers = await tickersResponse.json();
          const marketMovers = await marketMoversResponse.json();

          // Process and combine the data
          const processedData: MarketData = {
            tokens: tickers.map((ticker: any) => ({
              symbol: ticker.symbol,
              price: parseFloat(ticker.last_price) || 0,
              volume: parseFloat(ticker.volume_24h) || 0,
              price_change_24h: parseFloat(ticker.price_change_24h) || 0,
              mark_price: parseFloat(ticker.mark_price) || 0,
              funding_rate: parseFloat(ticker.funding_rate) || 0
            })).filter((t: any) => t.volume > 0)
            .sort((a: any, b: any) => b.volume - a.volume)
            .slice(0, 50), // Take top 50 by volume
            liquidations: []
          };

          console.log('Processed market data:', {
            totalTickers: tickers.length,
            processedTokens: processedData.tokens.length,
            sampleToken: processedData.tokens[0]
          });

          setFetchedMarketData(processedData);
          setDebugInfo(prev => ({
            ...prev,
            dbStatus: {
              isConnected: true,
              tables: {
                tickers: { 
                  rowCount: tickers.length, 
                  lastUpdate: new Date().toISOString() 
                },
                liquidations: { 
                  rowCount: 0, 
                  lastUpdate: new Date().toISOString() 
                },
                market_movers: { 
                  rowCount: marketMovers.length, 
                  lastUpdate: new Date().toISOString() 
                },
                kline_data: { 
                  rowCount: 2099000, // From your current data
                  lastUpdate: new Date().toISOString() 
                }
              }
            },
            activeTokens: processedData.tokens.length
          }));
        } catch (error) {
          console.error('Failed to fetch market data:', error);
          // Use test data on error
          const testData = generateTestData();
          setFetchedMarketData(testData);
          setDebugInfo(prev => ({
            ...prev,
            dbStatus: {
              isConnected: false,
              tables: {
                tickers: { 
                  rowCount: 0, 
                  lastUpdate: new Date().toISOString() 
                },
                liquidations: { rowCount: 0, lastUpdate: '' },
                market_movers: { rowCount: 0, lastUpdate: '' },
                kline_data: { rowCount: 0, lastUpdate: '' }
              }
            },
            activeTokens: testData.tokens.length
          }));
        }
      };

      const interval = setInterval(fetchData, 2000);
      fetchData();
      return () => clearInterval(interval);
    } else if (!propMarketData) {
      // Use test data if no prop data is provided
      const testData = generateTestData();
      setFetchedMarketData(testData);
    }
  }, [autoFetch, propMarketData]);

  // Initialize and update graph
  useEffect(() => {
    console.log('Graph initialization effect triggered', {
      hasContainer: !!containerRef.current,
      hasMarketData: !!marketData,
      tokenCount: marketData?.tokens?.length
    });

    if (!containerRef.current || !marketData?.tokens) {
      console.log('Missing required data:', {
        containerExists: !!containerRef.current,
        marketDataExists: !!marketData,
        tokenCount: marketData?.tokens?.length
      });
      return;
    }

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    console.log('Container dimensions:', { width, height });

    // Initialize force graph
    if (!graphRef.current) {
      console.log('Creating new ForceGraph3D instance');
      try {
        const Graph = new (ForceGraph3D as unknown as ForceGraphConstructor)();
        if (!Graph) {
          console.error('Failed to create ForceGraph3D instance');
          return;
        }

        const graph = Graph(containerRef.current);
        if (!graph) {
          console.error('Failed to initialize graph with container');
          return;
        }

        graphRef.current = graph;
        console.log('Graph instance created, configuring...');

        // Configure graph
        const g = graphRef.current;
        g.width(width)
          .height(height)
          .backgroundColor('#000005')
          .nodeThreeObject((node: NodeObject) => {
            const sprite = new SpriteText(node.id);
            sprite.color = '#ffffff';
            sprite.textHeight = 8;
            sprite.backgroundColor = node.color || '#ffffff';
            sprite.padding = 2;
            sprite.borderRadius = 5;
            return sprite;
          })
          .nodeThreeObjectExtend(true)
          .nodeColor((node: NodeObject) => node.color || '#ffffff')
          .nodeVal((node: NodeObject) => node.val || 5)
          .linkColor((link: LinkObject) => link.color || 'rgba(255,255,255,0.2)')
          .linkWidth((link: LinkObject) => link.value * 1)
          .linkOpacity(0.2)
          .linkDirectionalParticles(2)
          .linkDirectionalParticleSpeed(0.005)
          .showNavInfo(false)
          .d3Force('charge', d3.forceManyBody().strength(-100))
          .d3Force('center', d3.forceCenter(0, 0))
          .d3Force('collision', d3.forceCollide(5));

        console.log('Graph configuration complete');
    
        // Set initial camera position
        g.cameraPosition({ x: 0, y: 0, z: 150 });

        // Initialize with empty data
        g.graphData({ nodes: [], links: [] });

        // Handle window resize
        const handleResize = () => {
          if (containerRef.current && graphRef.current) {
            const newWidth = containerRef.current.clientWidth;
            const newHeight = containerRef.current.clientHeight;
            graphRef.current
              .width(newWidth)
              .height(newHeight)
              .cameraPosition({ x: 0, y: 0, z: 150 });
          }
        };

        window.addEventListener('resize', handleResize);
        return () => {
          window.removeEventListener('resize', handleResize);
        };
      } catch (error) {
        console.error('Error during graph initialization:', error);
        return;
      }
    }

    // Update graph data
    try {
      console.log('Creating graph data...');
      const graphData = createGraphData(marketData);
      console.log('Graph data created:', {
        nodes: graphData.nodes.length,
        links: graphData.links.length
      });

      if (graphRef.current && graphData.nodes.length > 0) {
        console.log('Updating graph with data...');
        graphRef.current.graphData(graphData);
        console.log('Graph data updated');
      } else {
        console.warn('Cannot update graph:', {
          hasGraph: !!graphRef.current,
          nodeCount: graphData.nodes.length
        });
      }
    } catch (error) {
      console.error('Error updating graph data:', error);
    }
  }, [marketData, config]);

  // Handle liquidation updates
  useEffect(() => {
    if (liquidationData && graphRef.current) {
      const { symbol, side } = liquidationData;
      const currentData = graphRef.current.graphData();
      const node = currentData.nodes.find(n => n.id === symbol);
      if (node) {
        const originalColor = node.color;
        const originalVal = node.val;
        node.color = side === 'buy' ? '#00ff00' : '#ff0000';
        node.val = originalVal * 2;
        
        setTimeout(() => {
          if (node) {
            node.color = originalColor;
            node.val = originalVal;
          }
        }, 1000);
      }
    }
  }, [liquidationData]);

  // Fetch database status
  useEffect(() => {
    const fetchDbStatus = async () => {
      try {
        console.log('Fetching database status...');
        const response = await fetch('/api/gamda/db-status');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Received database status:', data);
        setDebugInfo(prev => ({
          ...prev,
          dbStatus: data
        }));
      } catch (error) {
        console.error('Failed to fetch database status:', error);
        setDebugInfo(prev => ({
          ...prev,
          dbStatus: {
            isConnected: false,
            tables: {
              tickers: { rowCount: 0, lastUpdate: '' },
              liquidations: { rowCount: 0, lastUpdate: '' },
              market_movers: { rowCount: 0, lastUpdate: '' },
              kline_data: { rowCount: 0, lastUpdate: '' }
            }
          }
        }));
      }
    };

    const interval = setInterval(fetchDbStatus, 5000);
    fetchDbStatus();
    return () => clearInterval(interval);
  }, []);

  // Update frame count for FPS calculation
  useEffect(() => {
    const animate = () => {
      frameCount.current++;
      frameRef.current = requestAnimationFrame(animate);
    };
    
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  // Add debounced config update
  const updateGraphWithConfig = (newConfig: GamdaConfig) => {
    setIsUpdating(true);
    setConfig(newConfig);
    
    // Update graph with new config
    if (graphRef.current && marketData) {
      const graphData = createGraphData(marketData);
      
      // Smoothly transition node properties
      const currentData = graphRef.current.graphData();
      const oldNodesMap = new Map(currentData.nodes.map((n: NodeObject) => [n.id, n]));
      
      graphData.nodes.forEach(node => {
        const oldNode = oldNodesMap.get(node.id);
        if (oldNode) {
          (node as NodeObject).x = oldNode.x;
          (node as NodeObject).y = oldNode.y;
          (node as NodeObject).z = oldNode.z;
        }
      });

      // Update graph with smooth transitions
      graphRef.current
        .nodeColor((node: NodeObject) => node.color || '#ffffff')
        .nodeVal((node: NodeObject) => node.val || 5)
        .linkWidth((link: LinkObject) => link.value * newConfig.display.linkThicknessScale)
        .linkColor((link: LinkObject) => link.color || `rgba(255,255,255,${newConfig.graph.linkOpacity})`)
        .d3Force('charge', d3.forceManyBody().strength(newConfig.forces.repelForce))
        .d3Force('collision', d3.forceCollide().radius((node: any) => {
          const n = node as NodeObject;
          return (n.val || 5) * 1.2;
        }))
        .graphData(graphData);

      // Provide visual feedback
      setTimeout(() => setIsUpdating(false), 1000);
    }
  };

  // Update the config change handler in GamdaDebugOverlay props
  const handleConfigChange = (newConfig: GamdaConfig) => {
    updateGraphWithConfig(newConfig);
  };

  // Load saved configurations from localStorage on mount
  useEffect(() => {
    const savedConfigsStr = localStorage.getItem('gamdaConfigs');
    if (savedConfigsStr) {
      try {
        const configs = JSON.parse(savedConfigsStr);
        setSavedConfigs(configs);
      } catch (error) {
        console.error('Error loading saved configurations:', error);
      }
    }
  }, []);

  // Save configuration
  const handleSaveConfig = () => {
    if (!configName.trim()) {
      alert('Please enter a name for your configuration');
      return;
    }

    const newConfig: SavedConfig = {
      id: Date.now().toString(),
      name: configName.trim(),
      config: { ...config },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedConfigs = [...savedConfigs, newConfig];
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('gamdaConfigs', JSON.stringify(updatedConfigs));
    setConfigName('');
    setShowSaveDialog(false);
  };

  // Load configuration
  const handleLoadConfig = (savedConfig: SavedConfig) => {
    setConfig(savedConfig.config);
    setShowLoadDialog(false);
    setIsUpdating(true);
    setTimeout(() => setIsUpdating(false), 1000);
  };

  // Delete configuration
  const handleDeleteConfig = (id: string) => {
    const updatedConfigs = savedConfigs.filter(config => config.id !== id);
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('gamdaConfigs', JSON.stringify(updatedConfigs));
  };

  // Add camera position update handler
  const handleCameraPositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const newPosition = { ...cameraPosition, [axis]: value };
    setCameraPosition(newPosition);
    if (graphRef.current) {
      graphRef.current.cameraPosition(newPosition);
      setConfig(prev => ({
        ...prev,
        camera: {
          ...prev.camera,
          position: newPosition
        }
      }));
    }
  };

  // Add zoom update handler
  const handleZoomChange = (value: number) => {
    setCameraZoom(value);
    if (graphRef.current) {
      const newPosition = {
        ...cameraPosition,
        z: 150 / value // Adjust base distance based on zoom
      };
      graphRef.current.cameraPosition(newPosition);
      setConfig(prev => ({
        ...prev,
        camera: {
          ...prev.camera,
          position: newPosition,
          zoom: value
        }
      }));
    }
  };

  // Add camera position sync on graph initialization
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.cameraPosition(config.camera.position);
    }
  }, [config.camera.position]);

  // Add mouse wheel zoom handler
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (graphRef.current && event.deltaY !== 0) {
        const delta = -Math.sign(event.deltaY) * 0.1;
        const newZoom = Math.max(0.1, Math.min(5, cameraZoom + delta));
        handleZoomChange(newZoom);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel);
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [cameraZoom]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" style={{ background: '#000005' }} />
      {!marketData ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-white text-xl">Loading market data...</div>
        </div>
      ) : (
        <>
          {isUpdating && (
            <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
              Updating visualization...
            </div>
          )}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button 
              onClick={() => setShowDebug(!showDebug)}
              className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
              title="Toggle Debug Info"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v2"/>
                <path d="M19 12h2"/>
                <path d="M12 19v2"/>
                <path d="M3 12h2"/>
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
              </svg>
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
              title="Toggle Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          {showDebug && (
            <div className="absolute bottom-16 right-4 p-4 rounded-lg bg-black/30 backdrop-blur-sm text-white text-sm">
              <div>FPS: {Math.round(debugInfo.fps)}</div>
              <div>Active Tokens: {debugInfo.activeTokens}</div>
              {debugInfo.dbStatus?.isConnected && (
                <div className="text-green-400">DB Connected</div>
              )}
            </div>
          )}
          {showSettings && (
            <div className="absolute bottom-16 right-16 p-4 rounded-lg bg-black/30 backdrop-blur-sm text-white">
              <div className="space-y-4">
                <GamdaDebugOverlay
                  debugInfo={debugInfo}
                  config={config}
                  onConfigChange={handleConfigChange}
                  minimal={true}
                />

                {/* Camera Controls Section */}
                <div className="border-t border-white/20 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Camera Settings</h3>
                    <button
                      onClick={() => setShowCameraControls(!showCameraControls)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      {showCameraControls ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {showCameraControls && (
                    <div className="space-y-4 mt-2">
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-gray-400">X Position</label>
                            <input
                              type="number"
                              value={cameraPosition.x}
                              onChange={(e) => handleCameraPositionChange('x', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 bg-gray-700 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Y Position</label>
                            <input
                              type="number"
                              value={cameraPosition.y}
                              onChange={(e) => handleCameraPositionChange('y', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 bg-gray-700 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Z Position</label>
                            <input
                              type="number"
                              value={cameraPosition.z}
                              onChange={(e) => handleCameraPositionChange('z', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 bg-gray-700 rounded text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-gray-400">Zoom Level</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0.1"
                            max="5"
                            step="0.1"
                            value={cameraZoom}
                            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                            className="w-full"
                          />
                          <input
                            type="number"
                            value={cameraZoom}
                            onChange={(e) => handleZoomChange(parseFloat(e.target.value) || 1)}
                            className="w-20 px-2 py-1 bg-gray-700 rounded text-sm"
                            min="0.1"
                            max="5"
                            step="0.1"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            handleCameraPositionChange('x', 0);
                            handleCameraPositionChange('y', 0);
                            handleCameraPositionChange('z', 150);
                            handleZoomChange(1);
                          }}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                        >
                          Reset View
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save/Load Section */}
                <div className="border-t border-white/20 pt-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSaveDialog(true)}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded text-sm"
                    >
                      Save Config
                    </button>
                    <button
                      onClick={() => setShowLoadDialog(true)}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded text-sm"
                    >
                      Load Config
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Configuration Dialog */}
          {showSaveDialog && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
              <div className="bg-gray-800 p-6 rounded-lg w-96">
                <h3 className="text-xl text-white mb-4">Save Configuration</h3>
                <input
                  type="text"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="Enter configuration name"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveConfig}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Load Configuration Dialog */}
          {showLoadDialog && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
              <div className="bg-gray-800 p-6 rounded-lg w-[32rem]">
                <h3 className="text-xl text-white mb-4">Load Configuration</h3>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="py-2 text-left">Name</th>
                        <th className="py-2 text-left">Created</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedConfigs.map((savedConfig) => (
                        <tr key={savedConfig.id} className="border-b border-gray-700/50">
                          <td className="py-2">{savedConfig.name}</td>
                          <td className="py-2">{new Date(savedConfig.createdAt).toLocaleDateString()}</td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => handleLoadConfig(savedConfig)}
                              className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded text-sm mr-2"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => handleDeleteConfig(savedConfig.id)}
                              className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setShowLoadDialog(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}; 