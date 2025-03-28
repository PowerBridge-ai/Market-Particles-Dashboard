export interface GamdaConfig {
  galaxy: {
    numArms: number;
    spiralTightness: number;
    galaxyRadius: number;
    coreRadius: number;
    verticalDispersion: number;
    rotationSpeed: number;
  };
  stars: {
    minSize: number;
    maxSize: number;
    coreStarBrightness: number;
    colorIntensity: number;
    multiplier: number;
  };
  camera: {
    height: number;
    fov: number;
    near: number;
    far: number;
    position?: {
      x: number;
      y: number;
      z: number;
    };
    zoom?: number;
  };
  performance: {
    updateInterval: number;
    maxParticles: number;
    useTestData: boolean;
  };
  graph: {
    nodeSize: number;
    linkWidth: number;
    linkOpacity: number;
    linkDistance: number;
    linkBaseColor: string;
  };
  display: {
    nodeSizeScale: number;
    linkThicknessScale: number;
    maxNodes: number;
    textSize: number;
    textColor: string;
    backgroundColor: string;
  };
  forces: {
    repelForce: number;
    centerForce: number;
    linkForce: number;
  };
  animation: {
    enabled: boolean;
    rotationSpeed: number;
    frameInterval: number;
  };
  visualization: {
    mode: 'volume' | 'volatility' | 'momentum' | 'liquidations';
    correlation: {
      type: 'price' | 'volume' | 'volatility' | 'combined';
      threshold: number;
    };
    timeframe: '1h' | '4h' | '24h' | '7d';
    colorScheme: 'default' | 'heat' | 'gradient' | 'rainbow' | 'category';
    filters: {
      minVolume: number;
      minPrice: number;
      excludeStablecoins: boolean;
      onlyMajors: boolean;
    };
    grouping: {
      enabled: boolean;
      method: 'market-cap' | 'sector' | 'exchange' | 'none';
    };
  };
}

export const defaultConfig: GamdaConfig = {
  galaxy: {
    numArms: 4,
    spiralTightness: 0.8,
    galaxyRadius: 150,
    coreRadius: 20,
    verticalDispersion: 5,
    rotationSpeed: 0.0005
  },
  stars: {
    minSize: 2,
    maxSize: 8,
    coreStarBrightness: 0.9,
    colorIntensity: 0.8,
    multiplier: 1
  },
  camera: {
    height: 200,
    fov: 60,
    near: 0.1,
    far: 2000,
    position: {
      x: 0,
      y: 0,
      z: 150
    },
    zoom: 1
  },
  performance: {
    updateInterval: 5000,
    maxParticles: 2000,
    useTestData: false
  },
  graph: {
    nodeSize: 5,
    linkWidth: 1,
    linkOpacity: 0.2,
    linkDistance: 100,
    linkBaseColor: '#ffffff'
  },
  display: {
    nodeSizeScale: 10,
    linkThicknessScale: 2,
    maxNodes: 50,
    textSize: 8,
    textColor: '#ffffff',
    backgroundColor: '#000005'
  },
  forces: {
    repelForce: -100,
    centerForce: 0.5,
    linkForce: 0.5
  },
  animation: {
    enabled: true,
    rotationSpeed: 0.001,
    frameInterval: 16
  },
  visualization: {
    mode: 'volume',
    correlation: {
      type: 'price',
      threshold: 0.3
    },
    timeframe: '24h',
    colorScheme: 'default',
    filters: {
      minVolume: 1000000, // $1M minimum volume
      minPrice: 0,
      excludeStablecoins: false,
      onlyMajors: false
    },
    grouping: {
      enabled: true,
      method: 'market-cap'
    }
  }
}; 