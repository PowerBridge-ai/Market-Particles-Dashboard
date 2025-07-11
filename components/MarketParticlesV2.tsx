import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GamdaDebugOverlay } from './GamdaDebugOverlay';
import { GamdaConfig, defaultConfig } from '../config/gamda.config';
import type { MarketData as RawMarketData } from '../utils/dataUtils';
import type { ProcessedMarketData, ProcessedMarketToken } from '../types/market';
import { processMarketData } from '../types/market';

interface Star {
  symbol: string;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  currentPosition: THREE.Vector3;
  volume24h: number;
  size: number;
  distanceFromCenter: number;
  armIndex: number;
  velocity: number;
  initialAngle: number;
}

export interface LiquidationData {
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  timestamp: string;
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

interface MarketParticlesProps {
  marketData: RawMarketData | null;
  liquidationData?: LiquidationData;
  autoFetch?: boolean;
}

const MarketParticlesV2: React.FC<MarketParticlesProps> = ({ 
  marketData: propMarketData, 
  liquidationData,
  autoFetch = false 
}) => {
  const [fetchedMarketData, setFetchedMarketData] = useState<RawMarketData | null>(null);
  const [config, setConfig] = useState<GamdaConfig>(defaultConfig);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    dbStatus: null,
    fps: 0,
    activeTokens: 0
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const starsRef = useRef<Star[]>([]);
  const frameRef = useRef<number | null>(null);
  const galaxyRotationRef = useRef(0);
  const positionsRef = useRef<Float32Array | null>(null);
  const lastFrameTime = useRef(performance.now());
  const frameCount = useRef(0);
  const fpsUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  const rawMarketData = autoFetch ? fetchedMarketData : propMarketData;
  const marketData = rawMarketData ? processMarketData(rawMarketData) : null;

  // Helper function to handle optional fields
  const getTokenValue = (token: ProcessedMarketToken) => ({
    ...token,
    mark_price: token.mark_price ?? token.price,
    funding_rate: token.funding_rate ?? 0
  });

  // Process market data to ensure required fields
  const processedMarketData = marketData ? {
    ...marketData,
    tokens: marketData.tokens.map(getTokenValue)
  } : null;

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

  // Fetch market data if autoFetch is enabled
  useEffect(() => {
    if (autoFetch) {
      const fetchData = async () => {
        try {
          const response = await fetch('/api/market-data');
          const data = await response.json();
          setFetchedMarketData(data);
          setDebugInfo(prev => ({
            ...prev,
            dbStatus: {
              isConnected: true,
              tables: {
                tickers: { 
                  rowCount: data.tokens?.length || 0, 
                  lastUpdate: new Date().toISOString() 
                },
                liquidations: { 
                  rowCount: data.liquidations?.length || 0, 
                  lastUpdate: new Date().toISOString() 
                },
                market_movers: { rowCount: 0, lastUpdate: '' },
                kline_data: { rowCount: 0, lastUpdate: '' }
              }
            },
            activeTokens: data.tokens?.length || 0
          }));
        } catch (error) {
          console.error('Failed to fetch market data:', error);
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

      const interval = setInterval(fetchData, 5000);
      fetchData();
      return () => clearInterval(interval);
    }
  }, [autoFetch]);

  // Galaxy visualization effect
  useEffect(() => {
    if (!containerRef.current || !marketData?.tokens) {
      console.log('Container or market data not ready:', {
        containerExists: !!containerRef.current,
        marketDataExists: !!marketData,
        tokenCount: marketData?.tokens?.length
      });
      return;
    }

    console.log('Initializing galaxy visualization with:', {
      tokenCount: marketData.tokens.length,
      containerSize: {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      }
    });

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000005);

    // Camera setup for top-down view
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      2000
    );
    camera.position.set(0, config.camera.height, 0);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Clear any existing canvas
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    // Galaxy parameters
    const NUM_ARMS = config.galaxy.numArms;
    const ARM_SEPARATION = (2 * Math.PI) / NUM_ARMS;
    const SPIRAL_TIGHTNESS = config.galaxy.spiralTightness || 0.8;
    const GALAXY_RADIUS = config.galaxy.galaxyRadius || 150;
    const CORE_RADIUS = config.galaxy.coreRadius || 20;
    const VERTICAL_DISPERSION = config.galaxy.verticalDispersion || 5;

    console.log('Galaxy configuration:', {
      NUM_ARMS,
      SPIRAL_TIGHTNESS,
      GALAXY_RADIUS,
      CORE_RADIUS,
      VERTICAL_DISPERSION
    });

    // Sort tokens by volume
    const sortedTokens = [...marketData.tokens].sort((a, b) => b.volume - a.volume);
    const maxVolume = sortedTokens[0].volume;
    const minVolume = sortedTokens[sortedTokens.length - 1].volume;
    const volumeRange = maxVolume - minVolume;

    // Create geometry for the stars
    const starGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(sortedTokens.length * 3);
    const sizes = new Float32Array(sortedTokens.length);
    const colors = new Float32Array(sortedTokens.length * 3);
    positionsRef.current = positions;

    // Initialize sizes array
    sortedTokens.forEach((_, i) => {
      sizes[i] = config.stars.minSize + (config.stars.maxSize - config.stars.minSize) * Math.random();
    });

    // Create stars
    starsRef.current = sortedTokens.map((token, i) => {
      const volumeNorm = (token.volume - minVolume) / volumeRange;
      const armIndex = i % NUM_ARMS;
      
      // Calculate base distance from center
      let distanceFromCenter = volumeNorm > 0.8 
        ? CORE_RADIUS * Math.random() 
        : CORE_RADIUS + (GALAXY_RADIUS - CORE_RADIUS) * (1 - volumeNorm);

      // Calculate initial angle
      const armAngle = armIndex * ARM_SEPARATION;
      const spiralAngle = armAngle + (distanceFromCenter * SPIRAL_TIGHTNESS / GALAXY_RADIUS);
      
      // Calculate initial position
      const x = Math.cos(spiralAngle) * distanceFromCenter;
      const z = Math.sin(spiralAngle) * distanceFromCenter;
      const verticalDispersion = VERTICAL_DISPERSION * (1 - Math.pow(volumeNorm, 2));
      const y = (Math.random() - 0.5) * 2 * verticalDispersion;

      // Store positions
      const i3 = i * 3;
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      // Calculate star properties
      const size = config.stars.minSize + (config.stars.maxSize - config.stars.minSize) * Math.pow(volumeNorm, 0.7);
      sizes[i] = size;

      // Calculate star color based on price change
      const color = new THREE.Color();
      if (volumeNorm > 0.8) {
        // Core stars: bright blue-white
        color.setHSL(0.6, 0.2, 0.9);
      } else {
        // Color based on price change
        const priceChange = token.price_change_24h || 0;
        if (priceChange > 0) {
          // Green for positive change
          color.setHSL(0.3, 0.8, 0.4 + volumeNorm * 0.5);
        } else {
          // Red for negative change
          color.setHSL(0.0, 0.8, 0.4 + volumeNorm * 0.5);
        }
      }
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      return {
        symbol: token.symbol,
        position: new THREE.Vector3(x, y, z),
        targetPosition: new THREE.Vector3(x, y, z),
        currentPosition: new THREE.Vector3(x, y, z),
        volume24h: token.volume,
        size,
        distanceFromCenter,
        armIndex,
        velocity: 0.001 + 0.003 * (1 - volumeNorm),
        initialAngle: spiralAngle
      };
    });

    // Set geometry attributes
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Create star material
    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float r = distance(gl_PointCoord, vec2(0.5));
          if (r > 0.5) discard;
          
          float intensity = 1.0 - (r * 2.0);
          intensity = pow(intensity, 1.5);
          
          gl_FragColor = vec4(vColor, intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false
    });

    // Create point cloud
    const pointCloud = new THREE.Points(starGeometry, starMaterial);
    scene.add(pointCloud);

    // Set scene and camera
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Animation loop
    const animate = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

      // Update star positions
      const stars = starsRef.current;
      const now = performance.now();
      const elapsed = now - lastFrameTime.current;
      const frameCount = frameRef.current || 0;
      const frameTime = elapsed / 1000;
      const galaxyRotation = galaxyRotationRef.current;

      stars.forEach(star => {
        const { position, targetPosition, velocity, initialAngle } = star;
        const angle = initialAngle + galaxyRotation * 0.001;
        const x = Math.cos(angle) * GALAXY_RADIUS;
        const z = Math.sin(angle) * GALAXY_RADIUS;
        const y = (Math.random() - 0.5) * VERTICAL_DISPERSION;
        star.position.set(x, y, z);
        star.targetPosition.set(x, y, z);
      });

      // Update camera position
      cameraRef.current.position.set(0, config.camera.height, 0);
      cameraRef.current.lookAt(0, 0, 0);

      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);

      // Update frame count and time
      frameRef.current = frameCount + 1;
      lastFrameTime.current = now;

      // Request next frame
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [marketData, config]);

  return (
    <>
      <div ref={containerRef} className="fixed inset-0 z-0" />
      {!marketData ? (
        <div className="fixed inset-0 z-0 flex items-center justify-center bg-black">
          <div className="text-white text-xl">Loading market data...</div>
        </div>
      ) : (
        <GamdaDebugOverlay
          debugInfo={debugInfo}
          config={config}
          onConfigChange={setConfig}
        />
      )}
    </>
  );
};

export default MarketParticlesV2;