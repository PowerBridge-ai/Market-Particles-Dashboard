import Papa from 'papaparse';
import yaml from 'yaml';
import { Pool } from 'pg';

export interface MarketToken {
  symbol: string;
  price: number;
  volume: number;
  price_change_24h: number;
  mark_price?: number;
  funding_rate?: number;
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

// Parse CSV data
export const parseCSV = async (csvContent: string): Promise<MarketData> => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        try {
          const tokens = results.data
            .filter((row: any) => row.symbol && row.price && row.volume)
            .map((row: any) => ({
              symbol: row.symbol,
              price: Number(row.price),
              volume: Number(row.volume),
              price_change_24h: Number(row.price_change_24h || 0),
              mark_price: Number(row.mark_price || row.price),
              funding_rate: Number(row.funding_rate || 0)
            }));
            
          const liquidations = results.data
            .filter((row: any) => row.type && row.amount && row.symbol)
            .map((row: any) => ({
              type: row.type as 'long' | 'short',
              amount: Number(row.amount),
              symbol: row.symbol
            }));
            
          resolve({ 
            tokens: tokens.filter(t => !isNaN(t.price) && !isNaN(t.volume)),
            liquidations: liquidations.filter(l => !isNaN(l.amount))
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

// Parse JSON data
export const parseJSON = async (jsonContent: string): Promise<MarketData> => {
  try {
    const data = JSON.parse(jsonContent);
    
    // Handle different JSON structures
    if (data.tokens && Array.isArray(data.tokens)) {
      return {
        tokens: data.tokens.map((token: any) => ({
          symbol: token.symbol,
          price: Number(token.price),
          volume: Number(token.volume),
          price_change_24h: Number(token.price_change_24h || 0),
          mark_price: Number(token.mark_price || token.price),
          funding_rate: Number(token.funding_rate || 0)
        })),
        liquidations: (data.liquidations || []).map((liq: any) => ({
          type: liq.type as 'long' | 'short',
          amount: Number(liq.amount),
          symbol: liq.symbol
        }))
      };
    } else if (Array.isArray(data)) {
      // If it's an array, assume it's an array of tokens
      return {
        tokens: data.map((token: any) => ({
          symbol: token.symbol,
          price: Number(token.price),
          volume: Number(token.volume),
          price_change_24h: Number(token.price_change_24h || 0),
          mark_price: Number(token.mark_price || token.price),
          funding_rate: Number(token.funding_rate || 0)
        })),
        liquidations: []
      };
    }
    
    throw new Error('Invalid JSON structure');
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error}`);
  }
};

// Parse YAML data
export const parseYAML = async (yamlContent: string): Promise<MarketData> => {
  try {
    const data = yaml.parse(yamlContent);
    
    // Handle different YAML structures (similar to JSON)
    if (data.tokens && Array.isArray(data.tokens)) {
      return {
        tokens: data.tokens.map((token: any) => ({
          symbol: token.symbol,
          price: Number(token.price),
          volume: Number(token.volume),
          price_change_24h: Number(token.price_change_24h || 0),
          mark_price: Number(token.mark_price || token.price),
          funding_rate: Number(token.funding_rate || 0)
        })),
        liquidations: (data.liquidations || []).map((liq: any) => ({
          type: liq.type as 'long' | 'short',
          amount: Number(liq.amount),
          symbol: liq.symbol
        }))
      };
    } else if (Array.isArray(data)) {
      // If it's an array, assume it's an array of tokens
      return {
        tokens: data.map((token: any) => ({
          symbol: token.symbol,
          price: Number(token.price),
          volume: Number(token.volume),
          price_change_24h: Number(token.price_change_24h || 0),
          mark_price: Number(token.mark_price || token.price),
          funding_rate: Number(token.funding_rate || 0)
        })),
        liquidations: []
      };
    }
    
    throw new Error('Invalid YAML structure');
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

// Query from PostgreSQL
export const queryFromPostgres = async (
  connectionString: string, 
  tokensQuery: string,
  liquidationsQuery?: string
): Promise<MarketData> => {
  const pool = new Pool({
    connectionString,
  });
  
  try {
    // Query tokens
    const tokensResult = await pool.query(tokensQuery);
    
    // Query liquidations if provided
    let liquidationsResult = { rows: [] };
    if (liquidationsQuery) {
      liquidationsResult = await pool.query(liquidationsQuery);
    }
    
    // Parse the results
    const tokens = tokensResult.rows.map((row: any) => ({
      symbol: row.symbol,
      price: Number(row.price),
      volume: Number(row.volume),
      price_change_24h: Number(row.price_change_24h || 0),
      mark_price: Number(row.mark_price || row.price),
      funding_rate: Number(row.funding_rate || 0)
    }));
    
    const liquidations = liquidationsResult.rows.map((row: any) => ({
      type: row.type as 'long' | 'short',
      amount: Number(row.amount),
      symbol: row.symbol
    }));
    
    return { tokens, liquidations };
  } catch (error) {
    throw new Error(`Failed to query from PostgreSQL: ${error}`);
  } finally {
    await pool.end();
  }
}; 