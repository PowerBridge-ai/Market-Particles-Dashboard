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
    position: {
      x: number;
      y: number;
      z: number;
    };
    zoom: number;
  };
  performance: {
    updateInterval: number;
    maxParticles: number;
    useTestData: boolean;
    maxNodes: number;
    maxLinks: number;
    targetFps: number;
    autoAdjust: boolean;
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
    nodeSize: {
      min: number;
      max: number;
      byVolume: boolean;
    };
    nodeColor: {
      positive: string;
      negative: string;
      neutral: string;
      byChange: boolean;
    };
    links: {
      visible: boolean;
      particles: boolean;
      width: number;
      opacity: number;
      particleSpeed: number;
      particleCount: number;
    };
    physics: {
      gravity: number;
      linkStrength: number;
      linkDistance: number;
      repulsion: number;
      friction: number;
    };
    display: {
      showLabels: boolean;
      labelSize: number;
      background: string;
      highlight: string;
    };
  };
  debug: {
    showStats: boolean;
    logEvents: boolean;
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
    useTestData: false,
    maxNodes: 100,
    maxLinks: 500,
    targetFps: 30,
    autoAdjust: true
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
      type: 'combined',
      threshold: 0.5
    },
    nodeSize: {
      min: 1,
      max: 8,
      byVolume: true
    },
    nodeColor: {
      positive: '#4ade80',
      negative: '#f87171',
      neutral: '#60a5fa',
      byChange: true
    },
    links: {
      visible: true,
      particles: true,
      width: 0.5,
      opacity: 0.3,
      particleSpeed: 0.01,
      particleCount: 2
    },
    physics: {
      gravity: -0.1,
      linkStrength: 0.7,
      linkDistance: 100,
      repulsion: -80,
      friction: 0.9
    },
    display: {
      showLabels: true,
      labelSize: 1.8,
      background: '#111827',
      highlight: '#3b82f6'
    }
  },
  debug: {
    showStats: false,
    logEvents: false
  }
}; 