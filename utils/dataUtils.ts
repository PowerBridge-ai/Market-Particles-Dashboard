// Simple interfaces for market data
export interface MarketToken {
  symbol: string;
  price: number;
  volume: number;
  price_change_24h: number;
  mark_price: number;
  funding_rate: number;
}

export interface Liquidation {
  type: 'long' | 'short';
  amount: number;
  symbol: string;
}

export interface MarketData {
  tokens: MarketToken[];
  liquidations: Liquidation[];
}

export interface LiquidationEvent {
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  timestamp: string;
}

// Generate mock data
export const generateMockData = (tokenCount = 50, liquidationCount = 10): MarketData => {
  const tokens: MarketToken[] = [];
  const liquidations: Liquidation[] = [];
  
  // Generate tokens
  for (let i = 0; i < tokenCount; i++) {
    tokens.push({
      symbol: `TOKEN${i}`,
      price: Math.random() * 10000,
      volume: Math.random() * 10000000,
      price_change_24h: (Math.random() * 20) - 10,
      mark_price: Math.random() * 10000,
      funding_rate: Math.random() * 0.01
    });
  }
  
  // Generate liquidations
  for (let i = 0; i < liquidationCount; i++) {
    liquidations.push({
      type: Math.random() > 0.5 ? 'long' : 'short',
      amount: Math.random() * 100000,
      symbol: `TOKEN${Math.floor(Math.random() * tokenCount)}`
    });
  }
  
  return { tokens, liquidations };
};

// Generate a mock liquidation event
export const generateMockLiquidationEvent = (): LiquidationEvent => {
  return {
    symbol: 'BTC',
    side: Math.random() > 0.5 ? 'long' : 'short',
    quantity: Math.random() * 10000,
    price: 50000 + (Math.random() * 1000 - 500),
    timestamp: new Date().toISOString()
  };
};

// Simple CSV parser without dependencies
export const parseCSV = async (csvContent: string): Promise<MarketData> => {
  return new Promise((resolve, reject) => {
    try {
      const lines = csvContent.split('\n');
      if (lines.length < 2) {
        throw new Error('CSV must have at least a header row and one data row');
      }
      
      // Find token and liquidation sections
      let tokenHeaderIndex = -1;
      let liquidationHeaderIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('symbol,price,volume')) {
          tokenHeaderIndex = i;
        } else if (lines[i].trim().startsWith('type,amount,symbol')) {
          liquidationHeaderIndex = i;
        }
      }
      
      const tokens: MarketToken[] = [];
      const liquidations: Liquidation[] = [];
      
      // Parse tokens
      if (tokenHeaderIndex !== -1) {
        const tokenHeader = lines[tokenHeaderIndex].split(',');
        for (let i = tokenHeaderIndex + 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line || line.startsWith('type,amount,symbol')) break;
          
          const values = line.split(',');
          if (values.length >= 6) {
            tokens.push({
              symbol: values[0],
              price: parseFloat(values[1]),
              volume: parseFloat(values[2]),
              price_change_24h: parseFloat(values[3] || '0'),
              mark_price: parseFloat(values[4] || values[1]),
              funding_rate: parseFloat(values[5] || '0')
            });
          }
        }
      }
      
      // Parse liquidations
      if (liquidationHeaderIndex !== -1) {
        for (let i = liquidationHeaderIndex + 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) break;
          
          const values = line.split(',');
          if (values.length >= 3) {
            liquidations.push({
              type: values[0] as 'long' | 'short',
              amount: parseFloat(values[1]),
              symbol: values[2]
            });
          }
        }
      }
      
      resolve({ 
        tokens: tokens.filter(t => !isNaN(t.price) && !isNaN(t.volume)), 
        liquidations: liquidations.filter(l => !isNaN(l.amount))
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Parse JSON data
export const parseJSON = async (jsonContent: string): Promise<MarketData> => {
  try {
    const data = JSON.parse(jsonContent);
    
    // Helper function to process token data
    const processToken = (token: any) => ({
      symbol: token.symbol,
      price: Number(token.price),
      volume: Number(token.volume),
      price_change_24h: Number(token.price_change_24h || 0),
      mark_price: Number(token.mark_price || token.price),
      funding_rate: Number(token.funding_rate || 0)
    });

    // Helper function to process liquidation data
    const processLiquidation = (liq: any) => ({
      type: liq.type as 'long' | 'short',
      amount: Number(liq.amount),
      symbol: liq.symbol
    });

    // Handle different JSON structures
    if (data.tokens && Array.isArray(data.tokens)) {
      return {
        tokens: data.tokens.map(processToken),
        liquidations: (data.liquidations || []).map(processLiquidation)
      };
    } else if (Array.isArray(data)) {
      // If it's an array, assume it's an array of tokens
      return {
        tokens: data.map(processToken),
        liquidations: []
      };
    }
    
    throw new Error('Invalid JSON structure');
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error}`);
  }
};

// Simple YAML parser without dependencies - for demo purposes
export const parseYAML = async (yamlContent: string): Promise<MarketData> => {
  // For the demo, we'll use a very simplified approach
  // In a real app, you would use a proper YAML parser
  try {
    // Convert YAML to JSON (very simplified, only works for our specific format)
    let jsonString = yamlContent
      .replace(/tokens:/g, '{"tokens":')
      .replace(/liquidations:/g, ',"liquidations":')
      .replace(/  - /g, '{"')
      .replace(/    /g, '')
      .replace(/: /g, '":"')
      .replace(/\n/g, '","')
      .replace(/","}/g, '"}')
      .replace(/","","/g, '"},{"')
      .replace(/","liquidations/g, '"],"liquidations')
      .replace(/}$/g, ']}');

    // Parse the JSON string
    return parseJSON(jsonString);
  } catch (error) {
    throw new Error(`Failed to parse YAML: ${error}`);
  }
};

// Fetch from API
export const fetchFromAPI = async (apiUrl: string): Promise<MarketData> => {
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse the response based on its structure
    return await parseJSON(JSON.stringify(data));
  } catch (error) {
    throw new Error(`Failed to fetch from API: ${error}`);
  }
};

// Query from PostgreSQL - simplified to just return mock data
export const queryFromPostgres = async (
  connectionString: string, 
  tokensQuery: string,
  liquidationsQuery?: string
): Promise<MarketData> => {
  // Always return mock data for Vercel deployment
  console.warn('PostgreSQL queries are disabled in this environment. Returning mock data.');
  return generateMockData(10, 5);
}; 