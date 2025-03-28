import type { MarketData as RawMarketData, MarketToken as RawMarketToken } from '../utils/dataUtils';

// Define processed market data types with required fields
export interface ProcessedMarketToken extends Omit<RawMarketToken, 'mark_price' | 'funding_rate'> {
  mark_price: number;
  funding_rate: number;
}

export interface ProcessedMarketData {
  tokens: ProcessedMarketToken[];
  liquidations: RawMarketData['liquidations'];
}

// Helper function to process market data
export const processMarketToken = (token: RawMarketToken): ProcessedMarketToken => ({
  ...token,
  mark_price: token.mark_price ?? token.price,
  funding_rate: token.funding_rate ?? 0
});

export const processMarketData = (data: RawMarketData): ProcessedMarketData => ({
  ...data,
  tokens: data.tokens.map(processMarketToken)
}); 